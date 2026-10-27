// Date helpers for Member 2 (health). All dates are UTC midnight "YYYY-MM-DD".
// "Today" is taken in Pakistan time so reminders flip at local midnight.
const TZ = 'Asia/Karachi';

export function todayStr() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export const parseDate = (s) => new Date(`${s}T00:00:00Z`);

export const toDateStr = (d) => new Date(d).toISOString().slice(0, 10);

export function startOfDay(d) {
  const x = new Date(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()));
}

export function addDays(d, n) {
  const x = startOfDay(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export function addMonths(d, n) {
  const x = startOfDay(d);
  const day = x.getUTCDate();
  x.setUTCDate(1);
  x.setUTCMonth(x.getUTCMonth() + n);
  const lastDay = new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth() + 1, 0)).getUTCDate();
  x.setUTCDate(Math.min(day, lastDay));
  return x;
}

// Whole months from "from" to "to"
export function monthsBetween(from, to) {
  const a = startOfDay(from);
  const b = startOfDay(to);
  let m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) m -= 1;
  return Math.max(m, 0);
}

export function daysBetween(from, to) {
  return Math.round((startOfDay(to) - startOfDay(from)) / 86400000);
}
