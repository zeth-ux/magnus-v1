/**
 * Meet-up times are chosen and shown in Ansan's time (Asia/Seoul, UTC+9, no
 * daylight saving), whatever timezone the phone is set to.
 */
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** "2026-11-07T15:00" (a datetime-local value, read as Seoul time) → an ISO instant, or null. */
export function seoulLocalToIso(value: string): string | null {
  const m = LOCAL.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const utc = Date.UTC(y, mo - 1, d, h - 9, mi);
  const back = new Date(utc + 9 * 3_600_000);
  if (back.getUTCDate() !== d || back.getUTCMonth() !== mo - 1) return null; // 31 Nov and friends
  return new Date(utc).toISOString();
}

/** An instant → "Sat 7 Nov, 3:00 pm" in Seoul time. */
export function formatSeoul(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

/** The latest value for the picker: 60 days ahead in Seoul (the database's limit). */
export function seoulPickerMax(now: Date = new Date()): string {
  const seoul = new Date(now.getTime() + 9 * 3_600_000 + 60 * 86_400_000 - 3_600_000);
  return `${seoul.toISOString().slice(0, 13)}:00`;
}

/** The earliest value for the picker: the next full hour in Seoul. */
export function seoulPickerMin(now: Date = new Date()): string {
  const seoul = new Date(now.getTime() + 9 * 3_600_000 + 3_600_000);
  return `${seoul.toISOString().slice(0, 13)}:00`;
}

/** Whether an instant has passed (read on the server, per request). */
export const isPast = (iso: string, now: Date = new Date()) => new Date(iso).getTime() <= now.getTime();
