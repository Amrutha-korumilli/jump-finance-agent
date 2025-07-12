export default async function handler(req, res) {
    const baseUrl = "https://app.hubspot.com/oauth/authorize";
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const redirectUri = "http://localhost:3000/api/hubspot/callback";
  
    const scope = [
      "crm.objects.contacts.read",
      "crm.objects.contacts.write",
    ].join(" ");
  
    const fullUrl = `${baseUrl}?client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  
    return res.redirect(fullUrl);
  }
  