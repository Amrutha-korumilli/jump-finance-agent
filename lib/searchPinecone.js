// lib/searchPinecone.js
import { pineconeIndex } from "./pinecone";
import { getEmbedding } from "./cohere";

export async function queryRelevantDocs(embedding, userId, topK = 5) {
  const queryResponse = await pineconeIndex.query({
    topK,
    vector: embedding,
    includeMetadata: true,
    filter: {
      userId: { $eq: userId },
    },
  });

  return queryResponse.matches || [];
}
