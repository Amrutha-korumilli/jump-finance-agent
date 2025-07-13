// lib/hubspot.js
import fetch from 'node-fetch';

export async function fetchHubspotContacts(accessToken) {
  const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100', {
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  return json.results.map(c => ({
    id: c.id,
    name: `${c.properties.firstname || ''} ${c.properties.lastname || ''}`.trim(),
    email: c.properties.email,
    company: c.properties.company || '',
  }));
}

export async function fetchHubspotNotes(accessToken) {
  const res = await fetch(
    'https://api.hubapi.com/crm/v3/objects/notes?limit=100&properties=hs_note_body&associations=contacts',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const json = await res.json();
  if (!json.results || !Array.isArray(json.results)) return [];

  return json.results.map((n) => {
    const contactId = n.associations?.contacts?.results?.[0]?.id;
    return {
      id: n.id,
      content: n.properties.hs_note_body || '',
      contactId,
      createdAt: n.createdAt,
    };
  });
}
