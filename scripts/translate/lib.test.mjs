// @vitest-environment node
import { csvRow, languageOk, rowProblems, seededSample } from './lib.mjs';

describe('translation checks', () => {
  it('language share among letters, emoji/digits-only allowed', () => {
    expect(languageOk('Хорошая клиника, очень внимательный врач Dr. Taro', 'ru')).toBe(true);
    expect(languageOk('Хорошая клиника, врач Dr. Taro', 'ru')).toBe(false);
    expect(languageOk('Good clinic', 'ru')).toBe(false);
    expect(languageOk('👍', 'ru')).toBe(true);
    expect(languageOk('10/10 👍', 'en')).toBe(true);
    expect(languageOk('ดีมาก', 'en')).toBe(false);
  });

  it('row problems: empty needed text, non-empty original language, missing row', () => {
    const input = { id: 1, need_ru: true, need_en: false };
    expect(rowProblems(input, { id: 1, text_ru: 'Хорошо', text_en: '', uncertain: false })).toEqual(
      [],
    );
    expect(rowProblems(input, { id: 1, text_ru: '', text_en: '', uncertain: false })).toEqual([
      'пустой text_ru',
    ]);
    expect(
      rowProblems(input, { id: 1, text_ru: 'Хорошо', text_en: 'Good', uncertain: false })[0],
    ).toMatch(/пустым/);
    expect(rowProblems(input, undefined)).toEqual(['нет перевода']);
  });

  it('csv quotes every field and doubles quotes', () => {
    expect(csvRow(['a', 'b "c"', ''])).toBe('"a","b ""c""",""');
  });

  it('sample is deterministic', () => {
    const items = Array.from({ length: 50 }, (_, i) => i);
    expect(seededSample(items, 5, 42)).toEqual(seededSample(items, 5, 42));
    expect(new Set(seededSample(items, 50, 1)).size).toBe(50);
  });
});
