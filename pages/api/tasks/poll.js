import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import dayjs from 'dayjs';
import * as chrono from 'chrono-node';
import { sendEmailToolFunction } from '../../../lib/toolFunctions';
import { getAvailableTimeSlots } from '../../../lib/calendarAvailability';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const pendingTasks = await prisma.task.findMany({
    where: { type: 'scheduleMeeting', status: 'awaiting_reply' },
  });

  const results = [];

  console.log('🔍 Checking for pending tasks...', pendingTasks);
  for (const task of pendingTasks) {
    const { threadId, proposedTimes, toEmail, userId, lastRejectionReplyId } = task;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { hubspotToken: true },
    });
    const accessToken = user.googleAccessToken;

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const thread = await gmail.users.threads.get({ userId: 'me', id: threadId });
    const messages = thread.data.messages || [];

    const replies = messages
      .filter(m =>
        m.payload.headers.find(h => h.name === 'From' && h.value.includes(toEmail))
      )
      .sort((a, b) => parseInt(b.internalDate) - parseInt(a.internalDate));

    const reply = replies[0]; // most recent message from recipient
    if (!reply) {
      console.log(`⏳ No reply yet for task ${task.id}`);
      continue;
    }

    // Extract plain text message
    function getPlainTextFromMessage(message) {
      function extractFromParts(parts) {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8').toLowerCase();
          }
          if (part.parts) {
            const nested = extractFromParts(part.parts);
            if (nested) return nested;
          }
        }
        return null;
      }

      const parts = message.payload.parts || [];
      return extractFromParts(parts) || message.snippet?.toLowerCase() || '';
    }

    const bodyData = getPlainTextFromMessage(reply);
    const parsedDate = chrono.parseDate(bodyData);

    const oldTimes = JSON.parse(proposedTimes || '[]');
    const parsedStr = parsedDate ? dayjs(parsedDate).format('dddd, MMM D [at] h:mm A') : null;
    const match = parsedStr && oldTimes.find(t => t.includes(parsedStr));

    // ✅ User confirmed a valid proposed time
    if (match) {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: task.summary || 'Meeting',
          start: { dateTime: dayjs(parsedDate).toISOString() },
          end: { dateTime: dayjs(parsedDate).add(30, 'minutes').toISOString() },
          attendees: [{ email: toEmail }],
        },
      });

      await sendEmailToolFunction({
        to: toEmail,
        subject: 'Meeting Confirmed',
        body: `Thanks! Your meeting has been scheduled on ${parsedStr}.`,
        user,
      });

      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'done',
          lastRejectionReplyId: null, // ✅ Clear last rejection after confirmation
        },
      });

      results.push({ taskId: task.id, status: 'confirmed', scheduledAt: parsedStr });
      continue;
    }

    // ❌ No match — check for rejection
    const rejectionPhrases = ["none", "don't work", "not available", "can't do", "nothing works"];
    const rejectionDetected = rejectionPhrases.some(p => bodyData.includes(p));

    if (rejectionDetected) {
      if (reply.id === lastRejectionReplyId) {
        console.log(`🛑 Already responded to this rejection for task ${task.id}`);
        continue;
      }

      const newTimes = await getAvailableTimeSlots(user, oldTimes); // exclude previous times

      const body = `Hi again,\n\nThanks for your response! Here are some new proposed times:\n\n${newTimes.join('\n')}\n\nLet me know what works for you.\n\nThanks!`;

      const emailResult = await sendEmailToolFunction({
        to: toEmail,
        subject: 'New Meeting Time Options',
        body,
        user,
      });

      await prisma.task.update({
        where: { id: task.id },
        data: {
          proposedTimes: JSON.stringify(newTimes),
          threadId: emailResult.threadId,
          lastRejectionReplyId: reply.id, // ✅ Record rejection to avoid duplicate replies
          updatedAt: new Date(),
        },
      });

      console.log(`🔁 Sent new proposed times for task ${task.id}`);
      results.push({ taskId: task.id, status: 'resent_times', newTimes });
    } else {
      console.log(`❌ Couldn't extract valid time or detect rejection for task ${task.id}`);
    }
  }

  res.json({ ok: true, results });
}
