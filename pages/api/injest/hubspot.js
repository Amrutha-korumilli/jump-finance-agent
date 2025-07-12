// pages/api/ingest/hubspot.js
import { getToken } from "next-auth/jwt";
import { getEmbedding } from "../../../lib/cohere";
import { pineconeIndex } from "../../../lib/pinecone";
import { prisma } from "../../../lib/prisma";

export default async function handler(req, res) {
  const token = await getToken({ req });
  const email = token?.email;

  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { hubspotToken: true },
  });

  const hubToken = user?.hubspotToken?.accessToken;
  if (!hubToken) return res.status(400).json({ error: "No HubSpot token" });

  const notesRes = await fetch("https://api.hubapi.com/crm/v3/objects/notes", {
    headers: {
      Authorization: `Bearer ${hubToken}`,
    },
  });

  const { results } = await notesRes.json();

  for (let note of results) {
    const text = note.properties.hs_note_body;
    const embedding = await getEmbedding(text);

    await pineconeIndex.namespace(email).upsert([
      {
        id: `hubspot-${note.id}`,
        values: embedding,
        metadata: {
          source: "hubspot",
          content: text,
        },
      },
    ]);
  }

  res.status(200).json({ success: true, ingested: results.length });
}
