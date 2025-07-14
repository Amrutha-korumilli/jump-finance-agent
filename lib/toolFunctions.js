import { google } from 'googleapis';
import { findContactByName } from './findContact';
import { getAvailableTimeSlots } from './calendarAvailability';
import dayjs from 'dayjs';

export async function scheduleMeetingFunction({ email, time, summary, user }) {
  if (!user?.email || !user?.googleAccessToken) {
    throw new Error("Missing user credentials for calendar access.");
  }

  let toEmail = email;
  let contactName = '';

  if (!toEmail) {
    const contact = await findContactByName(summary || '', user);
    if (!contact || !contact.email) {
      throw new Error(`Could not find contact email for ${summary}`);
    }
    toEmail = contact.email;
    contactName = contact.name;
  }

  const proposedTimes = await getAvailableTimeSlots(user);

  const body = `Hi ${contactName || ''},\n\nAre you available to meet at any of the following times?\n\n${proposedTimes.join('\n')}\n\nLet me know what works for you.\n\nThanks!`;

  const result = await sendEmailToolFunction({
    to: toEmail,
    subject: summary || 'Scheduling a meeting',
    body,
    user,
  });

  // ✅ Save task with threadId
  await prisma.task.create({
    data: {
      userId: user.id,
      type: 'scheduleMeeting',
      status: 'awaiting_reply',
      toEmail: toEmail,
      summary: summary || '',
      proposedTimes: JSON.stringify(proposedTimes),
      threadId: result.threadId,
    },
  });

  return {
    status: 'email_sent',
    to: toEmail,
    times: proposedTimes,
    emailResult: result,
  };
}

export async function sendEmailToolFunction({ to, subject, body, user }) {
  if (!user?.email || !user?.googleAccessToken) {
    console.error("❌ Missing user credentials.");
    return { status: "failed", error: "User not authenticated" };
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user.googleAccessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const rawMessage = [
      `From: ${user.email}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    const { id: messageId, threadId } = response.data;

    console.log("✅ Email sent via Gmail REST API:", { messageId, threadId });

    return {
      status: "sent",
      messageId,
      threadId,
      to,
      subject,
      body,
    };
  } catch (error) {
    console.error("❌ Failed to send email via Gmail API:", error);
    return { status: "failed", error: error.message };
  }
}


export async function createHubspotContact({ name, email, company = "", user }) {
  console.log('user:', user);
  if (!user?.hubspotToken?.accessToken) {
    throw new Error("Missing HubSpot access token.");
  }

  const hubspotUrl = "https://api.hubapi.com/crm/v3/objects/contacts";
  const payload = {
    properties: {
      email,
      firstname: name?.split(" ")[0] || "",
      lastname: name?.split(" ")[1] || "",
      company
    }
  };

  const response = await fetch(hubspotUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.hubspotToken.accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
console.log("🔗 HubSpot API response:", response);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create HubSpot contact: ${response.status} - ${errorBody}`);
  }

  const result = await response.json();
  return `✅ Created HubSpot contact for ${name} (${email})`;
}

export async function scheduleMeeting({ email, time, summary }) {
  // Replace with real Calendar logic
  console.log("📅 Scheduling meeting:", { email, time, summary });
  const formatted = dayjs(time).format("MMMM D, YYYY h:mm A");
  return `Scheduled meeting with ${email} at ${formatted} titled "${summary}"`;
}
