// lib/search.js
import { getEmailEmbeddings } from "./embedding";
import { index } from "./pinecone";

export async function searchRelevantContext(query, userId) {
  const queryEmbedding = await getEmailEmbeddings([query]);

  const result = await index.query({
    vector: queryEmbedding[0],
    topK: 5,
    filter: { userId },
    includeMetadata: true,
  });

  const documents = result.matches
    .filter((m) => m?.metadata?.snippet || m?.metadata?.subject)
    .map((m) => ({
      from: m.metadata.from || "Unknown sender",
      subject: m.metadata.subject || "",
      snippet: m.metadata.snippet || "",
    }));

  return documents;
}
