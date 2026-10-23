/// <reference types="node" />
import { readFileSync } from 'node:fs';
import {
  DEFAULT_THEME,
  THEME_KEY,
  applyTheme,
  parseTheme,
  readStoredTheme,
  storeTheme,
} from './theme';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe('theme', () => {
  it('defaults to tishina and accepts only the two palettes', () => {
    expect(DEFAULT_THEME).toBe('tishina');
    expect(parseTheme('teplo')).toBe('teplo');
    expect(parseTheme('tishina')).toBe('tishina');
    expect(parseTheme('dark')).toBe('tishina');
    expect(parseTheme(null)).toBe('tishina');
  });

  it('stores the choice under lapa.theme', () => {
    expect(THEME_KEY).toBe('lapa.theme');
    expect(readStoredTheme()).toBe('tishina');
    storeTheme('teplo');
    expect(window.localStorage.getItem('lapa.theme')).toBe('teplo');
    expect(readStoredTheme()).toBe('teplo');
  });

  it('survives a broken localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(readStoredTheme()).toBe('tishina');
    expect(() => storeTheme('teplo')).not.toThrow();
  });

  it('sets data-theme on <html>', () => {
    applyTheme('teplo');
    expect(document.documentElement.dataset.theme).toBe('teplo');
  });
});

describe('index.html boot script', () => {
  const html = readFileSync(`${process.cwd()}/index.html`, 'utf8');
  // Скрипт в <head> выставляет палитру до первой отрисовки; проверяем его как есть.
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
  const run = () => new Function(script)();

  it('applies the stored palette and falls back to tishina', () => {
    expect(script).toContain('lapa.theme');
    window.localStorage.setItem('lapa.theme', 'teplo');
    run();
    expect(document.documentElement.dataset.theme).toBe('teplo');
    window.localStorage.setItem('lapa.theme', '"><img src=x>');
    run();
    expect(document.documentElement.dataset.theme).toBe('tishina');
    window.localStorage.removeItem('lapa.theme');
    run();
    expect(document.documentElement.dataset.theme).toBe('tishina');
  });

  it('does not throw without localStorage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    expect(run).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe('tishina');
  });
});
