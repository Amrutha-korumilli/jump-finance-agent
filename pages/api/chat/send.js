import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const token = await getToken({ req });
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });

  // Save user message
  await prisma.message.create({
    data: {
      text: message,
      sender: "user",
    },
  });

  // --- Replace with actual OpenAI logic later ---
  const mockReply = "This is a placeholder reply from the assistant.";
  // Save assistant message
  await prisma.message.create({
    data: {
      text: mockReply,
      sender: "agent",
    },
  });

  return res.status(200).json({ reply: mockReply });
}
