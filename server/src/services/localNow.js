// "Now" shifted by an optional timezone offset so that "today" matches the farm's local date.
// Set APP_UTC_OFFSET_MINUTES=300 in .env for Pakistan (UTC+5). If not set, behaviour is plain UTC (same as before).
const offsetMs = (Number.parseInt(process.env.APP_UTC_OFFSET_MINUTES || '0', 10) || 0) * 60000;

export const localNow = () => new Date(Date.now() + offsetMs);
