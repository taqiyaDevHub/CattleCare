// Date of birth from age in months (UTC midnight)
export function dobFromAgeMonths(months) {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - months);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export const toDateString = (d) => d.toISOString().slice(0, 10);