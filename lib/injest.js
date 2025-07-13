// lib/ingest.js
import { fetchGmailMessages } from "./gmail";
import { fetchHubspotContacts, fetchHubspotNotes } from "./hubspot";
import { getEmailEmbeddings } from "./embedding";
import { upsertToPinecone } from "./pinecone";

export async function ingestUserData(userId, gmailToken) {
  // Fetch data
  const emails = await fetchGmailMessages(gmailToken);
  const contacts = await fetchHubspotContacts(userId); // ✅ pass userId
//   const notes = await fetchHubspotNotes(userId);        // ✅ pass userId

  // Prepare texts
  const emailTexts = emails.map((e) => `${e.subject} ${e.snippet}`);
  const contactTexts = contacts.map((c) => `Contact: ${c.firstname} Email: ${c.email}`);
  console.log("contactTexts", contactTexts);
//   const noteTexts = notes.map((n) => `Note: ${n.content}`);

  const allTexts = [...emailTexts, ...contactTexts];
  if (allTexts.length === 0) return { success: false, count: 0 };

  const embeddings = await getEmailEmbeddings(allTexts);

  // Build Pinecone items
  const emailItems = emails.map((e, i) => ({
    id: `${userId}-email-${e.id}`,
    values: embeddings[i],
    metadata: {
      userId,
      source: "gmail",
      subject: e.subject,
      from: e.from,
      snippet: e.snippet,
    },
  }));

  const contactItems = contacts.map((c, i) => ({
    id: `${userId}-contact-${c.id}`,
    values: embeddings[emailItems.length + i],
    metadata: {
      userId,
      source: "hubspot_contact",
      name: c.name,
      email: c.email,
      company: c.company,
    },
  }));

//   const noteItems = notes.map((n, i) => ({
//     id: `${userId}-note-${n.id}`,
//     values: embeddings[emailItems.length + contactItems.length + i],
//     metadata: {
//       userId,
//       source: "hubspot_note",
//       content: n.content,
//       createdAt: n.createdAt,
//     },
//   }));

  const allItems = [...emailItems, ...contactItems];
  if (allItems.length === 0) return { success: false, count: 0 };

  // Final upsert
  await upsertToPinecone(allItems);

  return { success: true, count: allItems.length };
}
