import { google } from "googleapis";

export async function fetchCalendarEvents(accessToken, timeMin, timeMax, personName = null) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    maxResults: 50,
    singleEvents: true,
    orderBy: "startTime",
  });

  const events = response.data.items || [];

  return events
    .filter(event => {
      if (!personName) return true;

      const fullText = [
        event.summary || "",
        ...(event.attendees?.map(a =>
          `${a.displayName || ""} ${a.email || ""}`
        ) || []),
      ].join(" ").toLowerCase();

      const tokens = personName.toLowerCase().split(/\s+/);
      return tokens.every(t => fullText.includes(t));
    })
    .map(event => ({
      id: event.id,
      title: event.summary || "No Title",
      time: new Date(event.start.dateTime || event.start.date).toLocaleString(),
      attendees: (event.attendees || []).map(a => ({
        name: a.displayName || a.email,
        avatar: `https://www.gravatar.com/avatar/${a.email}?d=identicon`,
      })),
    }));
}
