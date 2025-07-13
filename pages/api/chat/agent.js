// pages/api/chat/agent.js

import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { CohereClient } from "cohere-ai";
import { searchRelevantContext } from "../../../lib/search";
import { tools } from "../../../lib/tools";
import { runTool } from "../../../lib/toolFunctions";

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

    // ✅ Ensure user exists
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // ✅ Save user message
    await prisma.message.create({
      data: {
        role: "user",
        sender: "user",
        content: message,
        user: { connect: { email } },
      },
    });

    // 🔍 Search relevant documents from Pinecone
    const user = await prisma.user.findUnique({ where: { email } });
    const contextResults = await searchRelevantContext(message, user.id);

    const documents = contextResults.map((item) => {
      const m = item.metadata || {};
      if (m.source === "gmail") {
        return {
          text: `Gmail email: Subject "${m.subject}", snippet "${m.snippet}"`,
        };
      } else if (m.source === "hubspot_contact") {
        return {
          text: `HubSpot contact: Name "${m.name}", Email "${m.email}", Company "${m.company}"`,
        };
      } else if (m.source === "hubspot_note") {
        return {
          text: `HubSpot note: ${m.content}`,
        };
      } else {
        return { text: JSON.stringify(m) };
      }
    });

    let toolResults = [];

    // 🧠 First pass — call Cohere with tools
    let completion = await cohere.chat({
      message,
      documents,
      preamble:
      "You are a smart assistant for financial advisors. You can use tools like sendEmail or create_hubspot_contact. If the user asks to schedule, notify, or reach out to someone, find their email from contacts or Gmail and use sendEmail tool. Be proactive and assume the user's intent is clear.",
      tools,
      toolResults,
      chatHistory: [],
    });

    // 🛠 If tools were requested
    if (completion.toolCalls && completion.toolCalls.length > 0) {
      for (const call of completion.toolCalls) {
        const toolName = call.name;
        const args = call.parameters;

        const result = await runTool(toolName, args);

        toolResults.push({
          callId: call.callId,
          outputs: [result],
        });
      }

      // Second pass with tool results
      completion = await cohere.chat({
        message,
        documents,
        preamble:
          "You are an AI agent for financial advisors. Use the documents and previous tool outputs to help.",
        tools,
        toolResults,
        chatHistory: [],
      });
    }

    const reply = completion.text;

    // ✅ Save assistant reply
    await prisma.message.create({
      data: {
        role: "assistant",
        sender: "agent",
        content: reply,
        user: { connect: { email } },
      },
    });

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI agent error:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
