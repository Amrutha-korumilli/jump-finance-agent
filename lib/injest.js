// lib/injest.js
import { fetchGmailMessages } from "./gmail";
import { getEmailEmbeddings } from "./embedding";
import { upsertToPinecone } from "./pinecone";

// Main ingestion function
export async function ingestUserData(userId, accessToken, cohereApiKey) {
  const emails = await fetchGmailMessages(accessToken);

  const texts = emails.map((e) => `${e.subject} ${e.snippet}`);
  const embeddings = await getEmailEmbeddings(texts, cohereApiKey); // ← key passed here

  const pineconeItems = emails.map((email, i) => ({
    id: `${userId}-gmail-${email.id}`,
    values: embeddings[i],
    metadata: {
      userId,
      source: "gmail",
      subject: email.subject,
      from: email.from,
      snippet: email.snippet,
    },
  }));

  await upsertToPinecone(pineconeItems);

  return { success: true, count: pineconeItems.length };
}
