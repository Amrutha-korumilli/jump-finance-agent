// lib/ingest.js
import { fetchGmailMessages } from './gmail';
import { fetchHubspotContacts, fetchHubspotNotes } from './hubspot';
import { getEmailEmbeddings } from './embedding';
import { upsertToPinecone } from './pinecone';

export async function ingestUserData(userId, gmailToken, hubspotToken) {
  const emails = await fetchGmailMessages(gmailToken);
  const contacts = await fetchHubspotContacts(hubspotToken);
  const notes = await fetchHubspotNotes(hubspotToken);
  console.log('Fetched data:', { emails, contacts, notes });
  const noteTexts = notes.map((n) => {
    const contact = contacts.find((c) => c.id === n.contactId);
    const contactName = contact?.name || "a contact";
    return `Note from ${contactName}: ${n.content}`;
  });
  
  const texts = [
    ...emails.map(e => `${e.subject} ${e.snippet}`),
    ...contacts.map(c => `Contact: ${c.name} Email: ${c.email} Company: ${c.company}`),
    ...noteTexts,
  ];
  

  const embeddings = await getEmailEmbeddings(texts);

  const items = [
    ...emails.map((e, i) => ({
      id: `${userId}-email-${e.id}`,
      values: embeddings[i],
      metadata: { userId, source: 'gmail', subject: e.subject, from: e.from, snippet: e.snippet },
    })),
    ...contacts.map((c, i) => ({
      id: `${userId}-contact-${c.id}`,
      values: embeddings[emails.length + i],
      metadata: { userId, source: 'hubspot_contact', name: c.name, email: c.email, company: c.company },
    })),
    ...notes.map((n, i) => ({
      id: `${userId}-note-${n.id}`,
      values: embeddings[emails.length + contacts.length + i],
      metadata: {
        userId,
        source: 'hubspot_note',
        content: n.content,
        contactId: n.contactId,
        contactName: contacts.find((c) => c.id === n.contactId)?.name || '',
        createdAt: n.createdAt,
      },
    }))
    
    
  ];

  if (items.length === 0) throw new Error('Nothing to ingest');
  await upsertToPinecone(items);
  return { success: true, count: items.length };
}
