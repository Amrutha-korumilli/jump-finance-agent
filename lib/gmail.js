// lib/gmail.js
import { google } from "googleapis";
import fetch from 'node-fetch';
import { getGoogleAccessToken } from './googleToken';

/**
 * Search Gmail messages matching a free-form query (name or text).
 */
export async function searchGmailByQuery(user, query) {
  
  const accessToken = user.googleAccessToken;
  const encodedQuery = encodeURIComponent(query);
  const threadListRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads?q=${encodedQuery}&maxResults=10`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const threadList = await threadListRes.json();
  if (!threadList.threads || threadList.threads.length === 0) return [];

  // Fetch full threads
  const threadDetails = await Promise.all(
    threadList.threads.map((t) =>
      fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${t.id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }).then((res) => res.json())
    )
  );

  return threadDetails;
}

/**
 * Attempt to extract sender/recipient email addresses from Gmail thread metadata
 */
export function extractEmailFromGmailThreads(threads, name) {
  const lowerName = name.toLowerCase();

  for (const thread of threads) {
    const messages = thread.messages || [];
    for (const msg of messages) {
      const headers = msg.payload?.headers || [];

      // Search in From and To fields
      for (const header of headers) {
        if (['From', 'To'].includes(header.name)) {
          const match = header.value.match(/([\w.-]+@[\w.-]+\.\w+)/);
          const nameMatch = header.value.toLowerCase().includes(lowerName);
          if (match && nameMatch) {
            return match[1]; // email address
          }
        }
      }
    }
  }

  return null;
}

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
