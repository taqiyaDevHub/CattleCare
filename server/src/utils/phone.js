export const PHONE_RE = /^03\d{9}$/;

// Accepts 03XXXXXXXXX, +923XXXXXXXXX, 00923XXXXXXXXX, 923XXXXXXXXX, 3XXXXXXXXX
export function normalizePhone(input) {
  let s = String(input).replace(/[\s\-()]/g, '');
  if (s.startsWith('+92')) s = '0' + s.slice(3);
  else if (s.startsWith('0092')) s = '0' + s.slice(4);
  else if (s.startsWith('92') && s.length === 12) s = '0' + s.slice(2);
  else if (/^3\d{9}$/.test(s)) s = '0' + s;
  return s;
}