import { google } from 'googleapis';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(utc);
dayjs.extend(isBetween);

const WORK_HOURS_START = 9; // 9 AM
const WORK_HOURS_END = 17; // 5 PM
const SLOT_DURATION_MINUTES = 30;

export async function getAvailableTimeSlots(user) {
  if (!user?.googleAccessToken || !user?.email) {
    throw new Error("Missing Google access token or user email.");
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: user.googleAccessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const now = dayjs();
  const end = now.add(3, 'day');

  // Request busy times from Google Calendar
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      timeZone: 'UTC',
      items: [{ id: 'primary' }],
    },
  });

  const busySlots = response.data.calendars.primary.busy.map(b => ({
    start: dayjs(b.start),
    end: dayjs(b.end),
  }));

  const availableSlots = [];

  for (let day = 0; day < 5 && availableSlots.length < 3; day++) {
    const date = now.add(day, 'day');
    if ([6, 0].includes(date.day())) continue; // skip weekends

    for (let hour = WORK_HOURS_START; hour < WORK_HOURS_END; hour++) {
      const slotStart = date.hour(hour).minute(0).second(0).millisecond(0);
      const slotEnd = slotStart.add(SLOT_DURATION_MINUTES, 'minute');

      const conflict = busySlots.some(busy =>
        slotStart.isBefore(busy.end) && slotEnd.isAfter(busy.start)
      );

      if (!conflict) {
        availableSlots.push(slotStart.format('dddd, MMM D [at] h:mm A'));
        if (availableSlots.length >= 3) break;
      }
    }
  }

  return availableSlots;
}
