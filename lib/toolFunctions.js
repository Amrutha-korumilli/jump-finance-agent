import { google } from 'googleapis';
import { getGoogleAccessToken } from './googleToken';
import dayjs from 'dayjs';

export async function sendEmailToolFunction({ to, subject, body, user }) {
  if (!user?.email || !user?.googleAccessToken) {
    console.error("❌ Missing user credentials.");
    return "Failed to send email: User is not authenticated with Google.";
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: user.googleAccessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const rawMessage = [
      `From: ${user.email}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("✅ Email sent via Gmail REST API:", response.data);
    return "Email successfully sent via Gmail!";
  } catch (error) {
    console.error("❌ Failed to send email via Gmail API:", error);
    return `Failed to send email: ${error.message}`;
  }
}

export async function createHubspotContact({ name, email, company }) {
  // Replace with real HubSpot API call
  console.log("📇 Creating HubSpot contact:", { name, email, company });
  return `Created contact for ${name} (${email}) at ${company || 'N/A'}`;
}

export async function scheduleMeeting({ email, time, summary }) {
  // Replace with real Calendar logic
  console.log("📅 Scheduling meeting:", { email, time, summary });
  const formatted = dayjs(time).format("MMMM D, YYYY h:mm A");
  return `Scheduled meeting with ${email} at ${formatted} titled "${summary}"`;
}
