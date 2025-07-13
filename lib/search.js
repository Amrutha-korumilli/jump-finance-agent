// lib/search.js
import { getEmailEmbeddings } from "./embedding";
import { pineconeIndex } from "./pinecone";

export async function searchRelevantContext(query, userId) {
  const queryEmbedding = await getEmailEmbeddings([query]);

  const result = await pineconeIndex.query({
    vector: queryEmbedding[0],
    topK: 5,
    includeMetadata: true,
    filter: { userId },
  });

  return result.matches || []; // ✅ This ensures it's always an array
}
