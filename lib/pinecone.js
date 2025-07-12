// lib/pinecone.js
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = process.env.PINECONE_INDEX_NAME;

if (!indexName) {
  throw new Error("Missing PINECONE_INDEX in .env");
}

export const index = pinecone.Index(indexName);
