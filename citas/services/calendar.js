const { google } = require('googleapis');
const path = require('path');

async function getClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, '../../google-credentials.json'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  const calendar = google.calendar({ version: 'v3', auth });
  return calendar;
}

async function createEvent(calendarId, { title, start, end, description, cliente }) {
  const cal = await getClient();
  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: title,
      description: `${description || ''}\nCliente: ${cliente?.nombre || ''}\nTel: ${cliente?.telefono || ''}`,
      start: { dateTime: start, timeZone: 'America/Mexico_City' },
      end: { dateTime: end, timeZone: 'America/Mexico_City' },
    },
  });
  return res.data;
}

async function updateEvent(calendarId, eventId, { title, start, end, description }) {
  const cal = await getClient();
  const res = await cal.events.update({
    calendarId,
    eventId,
    requestBody: {
      summary: title,
      description,
      start: { dateTime: start, timeZone: 'America/Mexico_City' },
      end: { dateTime: end, timeZone: 'America/Mexico_City' },
    },
  });
  return res.data;
}

async function deleteEvent(calendarId, eventId) {
  const cal = await getClient();
  await cal.events.delete({ calendarId, eventId });
}

module.exports = { createEvent, updateEvent, deleteEvent };
