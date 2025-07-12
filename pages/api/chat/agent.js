// pages/api/chat/agent.js

import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { CohereClient } from "cohere-ai";

const prisma = new PrismaClient();
const cohere = new CohereClient({ apiKey: process.env.CO_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const token = await getToken({ req });
    const email = token?.email;

    if (!email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "No message provided" });
    }

    // ✅ Ensure the user exists
    await prisma.user.upsert({
      where: { email },
      update: {}, // nothing to update
      create: { email },
    });

    // ✅ Save user message
    await prisma.message.create({
      data: {
        role: "user",
        sender: "user",
        content: message,
        user: {
          connect: { email },
        },
      },
    });

    // ✅ Get AI reply from Cohere
    const completion = await cohere.chat({
      message,
      chatHistory: [
        {
          role: "SYSTEM",
          message: "You are a smart AI agent that helps financial advisors. Use Gmail, HubSpot, and Calendar data to answer questions about meetings, clients, and tasks. Speak clearly and helpfully, like a human assistant."
        }
      ],
      connectors: [],
    });
    

    const reply = completion.text;

    // ✅ Save assistant reply
    await prisma.message.create({
      data: {
        role: "assistant",
        sender: "agent",
        content: reply,
        user: {
          connect: { email },
        },
      },
    });

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI agent error:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
