// lib/cohere.js
import cohere from "cohere-ai";

cohere.init(process.env.CO_API_KEY);

export async function getEmbedding(text) {
  const res = await cohere.embed({
    texts: [text],
    model: "embed-english-v3.0", // supports search + classification
    input_type: "search_document",
  });
  return res.body.embeddings[0];
}
