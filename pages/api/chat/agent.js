// pages/api/chat/agent.js
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { CohereClient } from "cohere-ai";
import { searchRelevantContext } from "../../../lib/search";

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

    // Ensure user exists
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    // Save user message
    await prisma.message.create({
      data: {
        role: "user",
        sender: "user",
        content: message,
        user: { connect: { email } },
      },
    });

    // 🔍 RAG: search context from Pinecone
    const user = await prisma.user.findUnique({ where: { email } });
    const contextResults = await searchRelevantContext(message, user.id) || [];

const formattedDocs = contextResults.map((item) => {
  const m = item.metadata || {};
  if (m.source === "gmail") {
    return {
      text: `From Gmail: Subject: ${m.subject}, Snippet: ${m.snippet}`,
    };
  } else if (m.source === "hubspot_contact") {
    return {
      text: `HubSpot Contact: ${m.firstname}, Email: ${m.email}, `,
    };
  } else if (m.source === "hubspot_note") {
    return {
      text: `HubSpot Note: ${m.content}`,
    };
  } else {
    return { text: JSON.stringify(m) };
  }
});
    

    // 🧠 Call Cohere chat API
    const completion = await cohere.chat({
      message,
      documents: formattedDocs,
      chatHistory: [],
      preamble: "You are an AI assistant for financial advisors. Use the provided documents to help answer accurately.",
    });

    const reply = completion.text;

    // Save assistant reply
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
