/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { THEMES, type Theme } from './theme';

// Чтение с диска: Vitest отдаёт CSS-модули (и ?raw) пустыми.
const css = readFileSync(`${process.cwd()}/design/tokens.css`, 'utf8');

// Контраст текста по WCAG 2.x для обеих палитр, значения берутся из design/tokens.css как есть.

function palette(theme: Theme): Record<string, string> {
  const selector =
    theme === 'tishina'
      ? /\[data-theme="tishina"\]\s*\{([^}]*)\}/
      : /\[data-theme="teplo"\]\s*\{([^}]*)\}/;
  const body = selector.exec(css)?.[1] ?? '';
  const vars: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/--([a-z-]+):\s*([^;]+);/g))
    vars[name!] = value!.trim();
  return vars;
}

type Rgb = [number, number, number];
function parse(value: string, under: Rgb): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1]!.slice(i, i + 2), 16)) as Rgb;
  const rgba = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!rgba) throw new Error(`unsupported color ${value}`);
  const [r, g, b, a = '1'] = rgba[1]!.split(',').map((s) => s.trim());
  const alpha = Number(a);
  return [r, g, b].map((c, i) => Number(c) * alpha + under[i]! * (1 - alpha)) as Rgb;
}
const luminance = (c: Rgb) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};
export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

// Все пары «текст на фоне», которые встречаются в интерфейсе.
const TEXT_PAIRS: [string, string][] = [
  ['ink', 'ground'],
  ['ink', 'surface'],
  ['sub', 'ground'],
  ['sub', 'surface'],
  ['tint', 'surface'],
  ['tint', 'ground'],
  ['on-tint', 'tint'],
  ['tint', 'tint-bg'],
  ['ink', 'tint-bg'],
  ['sub', 'tint-bg'],
  ['badge-ink', 'badge-bg'],
  ['ink', 'seg-bg'],
  ['sub', 'seg-bg'],
  ['tab-off', 'tab-bg'],
  ['tint', 'tab-bg'],
  ['ink', 'cta-bg'],
  ['tint', 'cta-bg'],
];

describe.each(THEMES)('palette %s', (theme) => {
  const vars = palette(theme);
  const ground = parse(vars.ground!, [255, 255, 255]);

  it('reads the palette from design/tokens.css', () => {
    expect(Object.keys(vars).length).toBeGreaterThanOrEqual(20);
  });

  it.each(TEXT_PAIRS)('%s on %s is at least 4.5:1', (fg, bg) => {
    expect(vars[fg], fg).toBeDefined();
    expect(vars[bg], bg).toBeDefined();
    const ratio = contrast(parse(vars[fg]!, ground), parse(vars[bg]!, ground));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
