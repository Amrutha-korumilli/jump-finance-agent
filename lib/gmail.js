// lib/gmail.js
import { google } from "googleapis";

export async function fetchGmailMessages(accessToken) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  const listRes = await gmail.users.messages.list({
    userId: "me",
    maxResults: 5,
  });

  const messages = listRes.data.messages || [];

  const messageDetails = await Promise.all(
    messages.map(async (msg) => {
      const detail = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = detail.data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value || "";
      const from = headers.find((h) => h.name === "From")?.value || "";
      const snippet = detail.data.snippet || "";

      return {
        id: msg.id,
        subject,
        from,
        snippet,
      };
    })
  );

  return messageDetails;
}
