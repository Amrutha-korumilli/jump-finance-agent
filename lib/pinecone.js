// lib/pinecone.js
import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME); // 👈 Must be defined in .env

export { pineconeIndex };

export async function upsertToPinecone(vectors) {
  await pineconeIndex.upsert(vectors);
}
