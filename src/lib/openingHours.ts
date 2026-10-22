// Разбор часов работы из Google (тайский формат):
// "วันจันทร์: 9:30 to 20:00; วันอังคาร: เปิด 24 ชั่วโมง; …; วันอาทิตย์: ปิดทำการ".
// Если формат не распознан — null, и экран показывает исходный текст как есть.

const THAI_DAYS = [
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
  'วันอาทิตย์',
];
const OPEN_24 = 'เปิด 24 ชั่วโมง';
const CLOSED = 'ปิดทำการ';
const TIME = String.raw`(\d{1,2}):(\d{2})`;
const RANGE = new RegExp(String.raw`^${TIME}\s*(?:to|–|-)\s*${TIME}$`);

export type DayHours =
  { kind: '24h' } | { kind: 'closed' } | { kind: 'ranges'; ranges: [string, string][] };

/** 7 дней с понедельника; null — формат не распознан или дней не 7. */
export type WeekHours = DayHours[];

const pad = (h: string, m: string) => `${h.padStart(2, '0')}:${m}`;

function parseDay(value: string): DayHours | null {
  const v = value.trim();
  if (v === OPEN_24) return { kind: '24h' };
  if (v === CLOSED) return { kind: 'closed' };
  const ranges: [string, string][] = [];
  for (const part of v.split(',')) {
    const m = RANGE.exec(part.trim());
    if (!m) return null;
    const [, h1 = '', m1 = '', h2 = '', m2 = ''] = m;
    if (Number(h1) > 24 || Number(h2) > 24 || Number(m1) > 59 || Number(m2) > 59) return null;
    ranges.push([pad(h1, m1), pad(h2, m2)]);
  }
  return { kind: 'ranges', ranges };
}

export function parseOpeningHours(raw: string | null): WeekHours | null {
  if (!raw?.trim()) return null;
  const week: (DayHours | undefined)[] = Array.from({ length: 7 }, () => undefined);
  for (const segment of raw.split(';')) {
    if (!segment.trim()) continue;
    const colon = segment.indexOf(':');
    if (colon < 0) return null;
    const day = THAI_DAYS.indexOf(segment.slice(0, colon).trim());
    const hours = parseDay(segment.slice(colon + 1));
    if (day < 0 || !hours || week[day]) return null;
    week[day] = hours;
  }
  return week.every(Boolean) ? (week as WeekHours) : null;
}

export type HoursRow = { from: number; to: number; hours: DayHours };

/** Склеивает соседние дни с одинаковыми часами: Пн–Сб 09:00–19:00, Вс выходной. */
export function groupDays(week: WeekHours): HoursRow[] {
  const rows: HoursRow[] = [];
  week.forEach((hours, day) => {
    const last = rows.at(-1);
    if (last && JSON.stringify(last.hours) === JSON.stringify(hours)) last.to = day;
    else rows.push({ from: day, to: day, hours });
  });
  return rows;
}
