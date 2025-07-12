// pages/api/ingest.js
import { getEmbedding } from "@/lib/cohere";
import { pineconeIndex } from "@/lib/pinecone";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { items, userId } = req.body;

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid items array" });
  }

  const vectors = await Promise.all(
    items.map(async (item) => {
      const embedding = await getEmbedding(item.text);
      return {
        id: item.id, // Unique ID (e.g., email ID or hubspot note ID)
        metadata: {
          text: item.text,
          source: item.source,
          userId,
        },
        values: embedding,
      };
    })
  );

  await pineconeIndex.upsert(vectors);

  return res.status(200).json({ message: "Ingested successfully" });
}
