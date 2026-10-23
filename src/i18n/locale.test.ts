import { en } from './en';
import {
  detectLang,
  detectTelegramLang,
  formatDate,
  formatRating,
  initialLang,
  readStoredLang,
  storeLang,
} from './locale';
import { ru } from './ru';

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([k, v]) => keysOf(v, prefix ? `${prefix}.${k}` : k));
}

describe('locale', () => {
  it('defaults to Russian and picks English only for an English browser', () => {
    expect(detectLang(['en-US', 'ru'])).toBe('en');
    expect(detectLang(['ru-RU'])).toBe('ru');
    expect(detectLang(['th-TH'])).toBe('ru');
    expect(detectLang([])).toBe('ru');
  });

  it('remembers the choice and prefers it over the browser language', () => {
    storeLang('en');
    expect(readStoredLang()).toBe('en');
    expect(initialLang()).toBe('en');
  });

  it('works when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(() => storeLang('en')).not.toThrow();
    expect(readStoredLang()).toBeNull();
  });

  it('has the same keys in ru and en', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(ru).sort());
  });

  it('formats ratings and dates per language', () => {
    expect(formatRating(4.6, 'ru')).toBe('4,6');
    expect(formatRating(5, 'en')).toBe('5.0');
    expect(formatDate('2026-10-03', 'ru')).toBe('3 октября 2026 г.');
    expect(formatDate('2026-10-03', 'en')).toBe('3 October 2026');
  });

  it('uses Russian plural forms', () => {
    expect(ru.venue.google('4,6', 1)).toBe('Google 4,6 · 1 отзыв');
    expect(ru.venue.google('4,6', 3)).toBe('Google 4,6 · 3 отзыва');
    expect(ru.venue.google('4,6', 707)).toBe('Google 4,6 · 707 отзывов');
    expect(en.venue.google('4.6', 1)).toBe('Google 4.6 · 1 review');
  });
});

describe('detectTelegramLang (first launch in Telegram)', () => {
  it('is Russian for ru or an unknown language, English otherwise', () => {
    expect(detectTelegramLang('ru')).toBe('ru');
    expect(detectTelegramLang('RU')).toBe('ru');
    expect(detectTelegramLang(undefined)).toBe('ru');
    expect(detectTelegramLang('')).toBe('ru');
    expect(detectTelegramLang('en')).toBe('en');
    expect(detectTelegramLang('th')).toBe('en');
    expect(detectTelegramLang('uk')).toBe('en');
  });
});
