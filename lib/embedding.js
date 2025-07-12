// lib/embedding.js
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({ apiKey: process.env.COHERE_API_KEY });

export async function getEmailEmbeddings(textArray) {
  if (!process.env.CO_API_KEY) {
    throw new Error("Cohere API key is missing!");
  }

  const response = await cohere.embed({
    texts: textArray,
    model: "embed-english-v3.0",
    inputType: "search_document", // good for RAG
  });

  return response.embeddings;
}
