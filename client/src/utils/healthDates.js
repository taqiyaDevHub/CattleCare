// Date helpers for the health screens. Dates from the API are "YYYY-MM-DD".
// "Today" uses Pakistan time, the same as the server, so both agree.
const TZ = 'Asia/Karachi';

export function todayStr() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

const toUtc = (s) => new Date(`${s}T00:00:00Z`);

// Days from today to the date (negative = in the past)
export function daysFromToday(dateStr) {
  return Math.round((toUtc(dateStr) - toUtc(todayStr())) / 86400000);
}

// "25 Oct 2026"
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return toUtc(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// "2026-10" -> "October 2026"
export function formatMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export const monthKey = (dateStr) => dateStr.slice(0, 7);
