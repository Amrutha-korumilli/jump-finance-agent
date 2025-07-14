import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { CohereClient } from "cohere-ai";
import { searchRelevantContext } from "../../../lib/search";
import { fetchCalendarEvents } from "../../../lib/calendar";
import { getGoogleAccessToken } from "../../../lib/googleToken";
import { extractToolCommand } from "../../../lib/parseToolPrompt";
import {
  sendEmailToolFunction,
  createHubspotContactFunction,
  scheduleMeetingFunction,
} from "../../../lib/toolFunctions";

import dayjs from "dayjs";
import * as chrono from "chrono-node";

const prisma = new PrismaClient();
const cohere = new CohereClient({ apiKey: process.env.CO_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const token = await getToken({ req });
    const email = token?.email;
    if (!email) return res.status(401).json({ error: "Unauthorized" });

    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    // Save user and message
    await prisma.user.upsert({ where: { email }, update: {}, create: { email } });

    await prisma.message.create({
      data: {
        role: "user",
        sender: "user",
        content: message,
        user: { connect: { email } },
      },
    });

    const user = await prisma.user.findUnique({ where: { email } });

    // Meeting handling
    const isMeetingQuery = /meetings?|calendar|appointment|event/i.test(message.toLowerCase());
    if (isMeetingQuery) {
      const now = dayjs();
      const msg = message.toLowerCase();
      let timeMin, timeMax;
      let isPastOnly = false;
      let person = null;

      const personMatch = message.match(/(?:with|about|for|from|to)\s([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/i);
      if (personMatch) person = personMatch[1].toLowerCase().trim();

      const parsed = (!/this month|last month/.test(msg)) ? chrono.parse(message) : [];
      if (parsed.length > 0) {
        const from = parsed[0].start?.date();
        const to = parsed[0].end?.date() || from;
        timeMin = dayjs(from).startOf("day").toISOString();
        timeMax = dayjs(to).endOf("day").toISOString();
      } else if (/this month/.test(msg)) {
        timeMin = now.startOf("month").toISOString();
        timeMax = now.endOf("month").toISOString();
      } else if (/last month/.test(msg)) {
        const lastMonth = now.subtract(1, "month");
        timeMin = lastMonth.startOf("month").toISOString();
        timeMax = lastMonth.endOf("month").toISOString();
      } else if (/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(msg)) {
        const match = msg.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/);
        const month = match[1];
        const monthIndex = new Date(`${month} 1, ${now.year()}`).getMonth();
        const monthStart = dayjs().month(monthIndex).startOf("month");
        const monthEnd = dayjs().month(monthIndex).endOf("month");

        timeMin = monthStart.toISOString();
        timeMax = monthEnd.toISOString();
      } else if (/completed|past/.test(msg)) {
        timeMin = now.subtract(3, "month").toISOString();
        timeMax = now.toISOString();
        isPastOnly = true;
      } else if (/upcoming|future|next/.test(msg)) {
        timeMin = now.toISOString();
        timeMax = now.add(60, "day").toISOString();
      } else {
        timeMin = now.subtract(30, "day").toISOString();
        timeMax = now.add(30, "day").toISOString();
      }

      const calendarToken = await getGoogleAccessToken(email);
      let allMeetings = await fetchCalendarEvents(calendarToken, timeMin, timeMax, person);

      if (isPastOnly) {
        allMeetings = allMeetings.filter((m) => dayjs(m.time).isBefore(now));
      }

      const reply = allMeetings.length
        ? `Here are ${allMeetings.length} meeting(s) I found:`
        : `I couldn't find any matching meetings.`;

      await prisma.message.create({
        data: {
          role: "assistant",
          sender: "agent",
          content: reply,
          user: { connect: { email } },
        },
      });

      return res.status(200).json({ reply, meetings: allMeetings });
    }

    // === RAG + LLM ===
    const contextResults = await searchRelevantContext(message, user.id);
    const documents = contextResults.map((item) => {
      const m = item.metadata || {};
      if (m.source === "gmail") {
        return { text: `Gmail email: Subject: ${m.subject}, Snippet: ${m.snippet}` };
      }
      if (m.source === "hubspot_contact") {
        return { text: `HubSpot Contact: Name: ${m.name}, Email: ${m.email}, Company: ${m.company}` };
      }
      if (m.source === "hubspot_note") {
        const name = m.contactName || "Unknown contact";
        return { text: `HubSpot Note from ${name}: ${m.content}` };
      }
      return { text: "Unknown source" };
    });

    const completion = await cohere.chat({
      message,
      documents,
      chatHistory: [],
      preamble: `
      You are an AI assistant. If a user asks you to send an email or schedule a meeting, output a line starting with TOOL: followed by details.
      Examples:
      TOOL: sendEmail TO: alice@example.com SUBJECT: Hello BODY: How are you?
      TOOL: scheduleMeeting TO: bob@example.com TIME: 2025-07-14T17:00:00Z SUMMARY: Sync
      `,
    });

    const finalReply = completion.text.trim();

    // 🛠 Manual tool extraction from text
    const toolData = extractToolCommand(finalReply);

    if (toolData?.name === "sendEmail") {
      try {
        const result = await sendEmailToolFunction({
          to: toolData.to,
          subject: toolData.subject,
          body: toolData.body,
          user,
        });
        console.log("✅ Email sent result:", result);
      } catch (err) {
        console.error("❌ Error in sendEmailToolFunction:", err);
      }
    }

    await prisma.message.create({
      data: {
        role: "assistant",
        sender: "agent",
        content: finalReply,
        user: { connect: { email } },
      },
    });

    return res.status(200).json({ reply: finalReply });
  } catch (error) {
    console.error("❌ agent.js error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
