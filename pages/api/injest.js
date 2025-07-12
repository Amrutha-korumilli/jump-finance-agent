// pages/api/injest.js
import { getToken } from "next-auth/jwt";
import prisma from "../../lib/prisma";
import { ingestUserData } from "../../lib/injest";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token?.accessToken || !token?.email) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await prisma.user.findUnique({ where: { email: token.email } });

  if (!user) {
    return res.status(404).json({ error: "User not found in DB" });
  }

  try {
    const result = await ingestUserData(user.id, token.accessToken, process.env.CO_API_KEY); // Pass Cohere key here
    res.status(200).json({ message: `Ingested ${result.count} emails.` });
  } catch (err) {
    console.error("Ingestion error:", err);
    res.status(500).json({ error: "Failed to ingest user data" });
  }
}
