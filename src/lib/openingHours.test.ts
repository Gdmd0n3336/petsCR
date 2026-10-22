import { groupDays, parseOpeningHours } from './openingHours';

const days = [
  'วันจันทร์',
  'วันอังคาร',
  'วันพุธ',
  'วันพฤหัสบดี',
  'วันศุกร์',
  'วันเสาร์',
  'วันอาทิตย์',
];
const week = (values: string[]) => days.map((d, i) => `${d}: ${values[i] ?? values[0]}`).join('; ');

describe('parseOpeningHours', () => {
  it('parses ranges, 24h and closed days', () => {
    const parsed = parseOpeningHours(
      week([
        '9:00 to 19:00',
        '9:00 to 19:00',
        '9:00 to 19:00',
        '9:00 to 19:00',
        '9:00 to 19:00',
        'เปิด 24 ชั่วโมง',
        'ปิดทำการ',
      ]),
    );
    expect(parsed?.[0]).toEqual({ kind: 'ranges', ranges: [['09:00', '19:00']] });
    expect(parsed?.[5]).toEqual({ kind: '24h' });
    expect(parsed?.[6]).toEqual({ kind: 'closed' });
  });

  it('handles closing at midnight and several intervals', () => {
    expect(parseOpeningHours(week(['8:00 to 0:00']))?.[0]).toEqual({
      kind: 'ranges',
      ranges: [['08:00', '00:00']],
    });
    expect(parseOpeningHours(week(['9:00 to 12:00, 13:00 to 20:00']))?.[0]).toEqual({
      kind: 'ranges',
      ranges: [
        ['09:00', '12:00'],
        ['13:00', '20:00'],
      ],
    });
  });

  it('returns null for unknown formats so the raw text is shown', () => {
    expect(parseOpeningHours(null)).toBeNull();
    expect(parseOpeningHours('Mon-Fri 9-18')).toBeNull();
    expect(parseOpeningHours(week(['by appointment']))).toBeNull();
    expect(parseOpeningHours(week(['9:99 to 19:00']))).toBeNull();
    expect(parseOpeningHours('วันจันทร์: 9:00 to 19:00')).toBeNull();
  });
});

describe('groupDays', () => {
  it('merges neighbouring days with the same hours', () => {
    const parsed = parseOpeningHours(
      week([
        '9:00 to 19:00',
        '9:00 to 19:00',
        '9:00 to 19:00',
        '9:00 to 19:00',
        '9:00 to 19:00',
        '9:00 to 19:00',
        'ปิดทำการ',
      ]),
    )!;
    expect(groupDays(parsed).map(({ from, to, hours }) => [from, to, hours.kind])).toEqual([
      [0, 5, 'ranges'],
      [6, 6, 'closed'],
    ]);
  });
});
