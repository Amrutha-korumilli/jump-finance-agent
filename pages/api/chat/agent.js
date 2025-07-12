// /pages/api/chat/agent.js
import { getToken } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";
import { OpenAI } from "openai";

const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const token = await getToken({ req });
  if (!token || !token.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    // Save user's message to DB
    await prisma.message.create({
        data: {
          role: "user",
          content: message,
          email: token.email,
          sender: "user", // or whatever appropriate value
        },
      });
      
    // Call OpenAI to get a reply
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI agent that assists with meetings, emails, and CRM tasks.",
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    // Save AI reply to DB
    await prisma.message.create({
        data: {
          role: "assistant",
          content: reply,
          email: token.email,
          sender: "agent",
        },
      });
      

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("AI agent error:", error);
    return res.status(500).json({ error: "Something went wrong." });
  }
}
