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
    const user = await prisma.user.upsert({
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

    // RAG: Get relevant context
    const ragContext = await searchRelevantContext(message, user.id);

    // Call Cohere Chat API with context
    const completion = await cohere.chat({
      message,
      documents: ragContext,
      chatHistory: [],
      temperature: 0.3,
      promptTruncation: "AUTO",
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
