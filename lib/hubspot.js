// lib/hubspot.js
import axios from "axios";
import prisma from "./prisma";

export async function fetchHubspotContacts(userId) {
    console.log('useriD', userId);
  const tokenRecord = await prisma.hubspotToken.findUnique({
    where: { userId },
  });

  if (!tokenRecord) {
    throw new Error("HubSpot token missing");
  }

  const { accessToken } = tokenRecord;

  const res = await axios.get(
    "https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const contacts = res.data.results.map((c) => ({
    id: c.id,
    firstname: c.properties.firstname || "",
    lastname: c.properties.lastname || "",
    email: c.properties.email || "",
  }));

  return contacts;
}
