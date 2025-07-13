// lib/embedding.js
import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({ apiKey: process.env.COHERE_API_KEY });

export async function getEmailEmbeddings(textArray) {
  const batchSize = 96;
  const allEmbeddings = [];

  for (let i = 0; i < textArray.length; i += batchSize) {
    const batch = textArray.slice(i, i + batchSize);
    const response = await cohere.embed({
      texts: batch,
      model: "embed-english-v3.0",
      inputType: "search_document",
    });

    allEmbeddings.push(...response.embeddings);
  }

  return allEmbeddings;
}
