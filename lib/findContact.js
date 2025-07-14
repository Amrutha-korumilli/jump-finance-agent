import { fetchHubspotContacts } from './hubspot';
import { searchGmailByQuery, extractEmailFromGmailThreads } from './gmail';

export async function findContactByName(name, user) {
  const lowerName = name.toLowerCase();

  // 🔍 HubSpot API lookup
  const accessToken = user?.hubspotToken?.accessToken;
  if (accessToken) {
    const hubspotContacts = await fetchHubspotContacts(accessToken);
    const hsMatch = hubspotContacts.find(c =>
      c.name.toLowerCase().includes(lowerName)
    );
    if (hsMatch) {
      return {
        name: hsMatch.name,
        email: hsMatch.email,
        source: 'hubspot',
      };
    }
  }

  // 🔍 Gmail search
  const gmailThreads = await searchGmailByQuery(user, name);
  const gmailMatch = extractEmailFromGmailThreads(gmailThreads, name);
  if (gmailMatch) {
    return {
      name,
      email: gmailMatch,
      source: 'gmail',
    };
  }

  return null;
}
