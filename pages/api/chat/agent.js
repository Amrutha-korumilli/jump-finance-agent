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
    const contextResults = await searchRelevantContext(message, user.id);

    // ✅ Format metadata into plain text documents
    const documents = contextResults.map(item => {
      const m = item.metadata || {};
      if (m.source === 'gmail') {
        return { text: `Gmail email: Subject: ${m.subject}, Snippet: ${m.snippet}` };
      }
      if (m.source === 'hubspot_contact') {
        return { text: `HubSpot Contact: Name: ${m.name}, Email: ${m.email}, Company: ${m.company}` };
      }
      if (m.source === 'hubspot_note') {
        const name = m.contactName || 'Unknown contact';
        return { text: `HubSpot Note from ${name}: ${m.content}` };
      }
      return { text: 'Unknown source' };
    });
    

    // 🧠 Call Cohere chat API
    const completion = await cohere.chat({ message, documents, chatHistory: [], preamble:  "You are an AI assistant for financial advisors. Use the provided documents to help answer accurately." });
    const reply = completion.text;
  
    await prisma.message.create({ data: { role: 'assistant', sender: 'agent', content: reply, user: { connect: { email } } } });
  
    return res.status(200).json({ reply });
    } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}