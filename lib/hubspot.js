// lib/hubspot.js

export async function fetchHubspotContacts(accessToken) {
    const res = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email&limit=10",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
  
    const data = await res.json();
  
    return (data.results || []).map((c) => ({
      id: c.id,
      name: `${c.properties.firstname || ""} ${c.properties.lastname || ""}`,
      email: c.properties.email,
    }));
  }
  