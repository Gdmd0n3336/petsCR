/// <reference types="node" />
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// «Нигде нет цветов вне токенов»: в стилях и коде приложения цвета только через var(--…).
// Чтение с диска: Vitest отдаёт CSS-модули пустыми.
const SRC = join(process.cwd(), 'src') + '/';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'test' ? [] : files(full);
    return /\.(css|ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

const NAMED =
  /:\s*(?:[^;{}]*\s)?(white|black|red|green|blue|gray|grey|yellow|orange|purple|pink|silver)\b/i;
// Исключение DESIGN.md §4: точки переключателя палитры показывают обе палитры сразу.
const SWITCH_DOT = /\.theme-switch__dot--(tishina|teplo) \{[^}]*?background: (#[0-9a-f]{6});/gi;
const switchDots = (css: string) =>
  Object.fromEntries([...css.matchAll(SWITCH_DOT)].map((m) => [m[1], m[2]!.toLowerCase()]));
const tintOf = (tokens: string, theme: 'tishina' | 'teplo') =>
  new RegExp(`\\[data-theme="${theme}"\\][^{]*\\{[^}]*?--tint:\\s*(#[0-9a-f]{6})`, 'i')
    .exec(tokens)?.[1]
    ?.toLowerCase();

const sources = files(SRC).map((f) => [f.slice(SRC.length), readFileSync(f, 'utf8')] as const);

describe('no raw colors outside design tokens', () => {
  it('reads the app sources, styles included', () => {
    expect(sources.length).toBeGreaterThan(30);
    const styles = sources.find(([name]) => name === 'styles.css');
    expect(styles?.[1].length).toBeGreaterThan(1000);
  });

  it('palette switch dots match --tint of both palettes in design/tokens.css', () => {
    const styles = sources.find(([name]) => name === 'styles.css')![1];
    const tokens = readFileSync(join(process.cwd(), 'design/tokens.css'), 'utf8');
    expect(switchDots(styles)).toEqual({
      tishina: tintOf(tokens, 'tishina'),
      teplo: tintOf(tokens, 'teplo'),
    });
    expect(tintOf(tokens, 'tishina')).toMatch(/^#/);
  });

  it.each(sources)('%s', (file, raw) => {
    const text = raw
      .replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '')
      .replace(SWITCH_DOT, (block) => block.replace(/#[0-9a-f]{6}/i, 'var(--allowed)'));
    if (file.endsWith('.css')) {
      expect(text).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(text).not.toMatch(/\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklch|oklab)\(/i);
      expect(text).not.toMatch(NAMED);
    } else {
      expect(text).not.toMatch(/['"`]#[0-9a-f]{3,8}['"`]/i);
      expect(text).not.toMatch(/['"`](?:rgb|rgba|hsl|hsla)\(/i);
    }
  });
});
