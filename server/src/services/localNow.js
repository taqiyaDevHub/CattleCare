// Calendar calculations use the farm's configured timezone (Asia/Karachi by default).
const timeZone = process.env.APP_TIME_ZONE || 'Asia/Karachi';

function getTimeZoneOffsetMs(date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const localAsUtc = Date.UTC(
    Number(values.year), Number(values.month) - 1, Number(values.day),
    Number(values.hour), Number(values.minute), Number(values.second),
  );
  return localAsUtc - (date.getTime() - date.getUTCMilliseconds());
}

// Returns a Date whose UTC fields represent the current wall-clock fields in timeZone.
// Existing callers use UTC getters/setters on this value for calendar-day arithmetic.
export const localNow = () => {
  const now = new Date();
  return new Date(now.getTime() + getTimeZoneOffsetMs(now));
};

export const localDateString = (date = new Date()) =>
  new Date(date.getTime() + getTimeZoneOffsetMs(date)).toISOString().slice(0, 10);

export const localMonthString = (date = new Date()) => localDateString(date).slice(0, 7);
