
  // lib/hubspot.js
export async function fetchContacts(accessToken) {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,emaillimit=100", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return data.results || [];
  }
  
  export async function fetchContactNotes(accessToken) {
    const res = await fetch("https://api.hubapi.com/crm/v3/objects/notes?limit=100", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    return data.results || [];
  }
  
  