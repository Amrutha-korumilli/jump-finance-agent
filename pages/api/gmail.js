import { getToken } from "next-auth/jwt";

export default async function handler(req, res) {
  const token = await getToken({ req });

  if (!token || !token.accessToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const gmailResponse = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5",
      {
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
        },
      }
    );

    const gmailData = await gmailResponse.json();

    const messagePromises = gmailData.messages.map(async (msg) => {
      const msgDetailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
        {
          headers: {
            Authorization: `Bearer ${token.accessToken}`,
          },
        }
      );
      return await msgDetailRes.json();
    });

    const fullMessages = await Promise.all(messagePromises);

    const parsed = fullMessages.map((m) => {
      const headers = m.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      return {
        id: m.id,
        subject,
        from,
      };
    });

    res.status(200).json({ messages: parsed });
  } catch (error) {
    console.error("Gmail fetch error:", error);
    res.status(500).json({ error: "Failed to fetch Gmail messages" });
  }
}
