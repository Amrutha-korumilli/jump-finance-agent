import { getToken } from "next-auth/jwt";
import prisma from "../../../lib/prisma";

export default async function handler(req, res) {
  const session = await getToken({ req });
  const email = session?.email;

  if (!email) return res.status(401).json({ error: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { email },
    include: { hubspotToken: true },
  });

  const accessToken = user?.hubspotToken?.accessToken;

  if (!accessToken) {
    return res.status(403).json({ error: "No HubSpot token found" });
  }

  try {
    const response = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email&limit=5",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    const contacts = data.results.map((c) => ({
      id: c.id,
      firstname: c.properties.firstname,
      lastname: c.properties.lastname,
      email: c.properties.email,
    }));

    res.status(200).json({ contacts });
  } catch (err) {
    console.error("HubSpot Contacts Error:", err);
    res.status(500).json({ error: err.message });
  }
}
