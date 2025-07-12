// pages/api/ingest/gmail.js
import { getToken } from "next-auth/jwt";
import { google } from "googleapis";
import { getEmbedding } from "../../../lib/cohere";
import { pineconeIndex } from "../../../lib/pinecone";

export default async function handler(req, res) {
  const token = await getToken({ req });
  const email = token?.email;

  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token.accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  const { data } = await gmail.users.messages.list({ userId: "me", maxResults: 5 });
  const messages = data.messages || [];

  for (let msg of messages) {
    const fullMsg = await gmail.users.messages.get({ userId: "me", id: msg.id });
    const body = fullMsg.data.snippet || ""; // Can use full body if needed

    const embedding = await getEmbedding(body);

    await pineconeIndex.namespace(email).upsert([
      {
        id: `gmail-${msg.id}`,
        values: embedding,
        metadata: {
          source: "gmail",
          content: body,
        },
      },
    ]);
  }

  res.status(200).json({ success: true, ingested: messages.length });
}
