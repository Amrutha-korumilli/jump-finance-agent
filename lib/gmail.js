// lib/gmail.js
import { google } from "googleapis";

export async function fetchGmailMessages(accessToken, maxEmails = 300) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  let allMessages = [];
  let nextPageToken = undefined;

  try {
    while (allMessages.length < maxEmails) {
      const res = await gmail.users.messages.list({
        userId: "me",
        maxResults: 100,
        pageToken: nextPageToken,
      });

      const messages = res.data.messages || [];
      allMessages = allMessages.concat(messages);

      nextPageToken = res.data.nextPageToken;
      if (!nextPageToken || allMessages.length >= maxEmails) break;
    }

    const messageDetails = await Promise.all(
      allMessages.slice(0, maxEmails).map(async (msg) => {
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
  } catch (err) {
    console.error("Error fetching Gmail messages:", err);
    return [];
  }
}
