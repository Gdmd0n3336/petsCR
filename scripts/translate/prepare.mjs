// Разбивка data/translation_input.jsonl на пакеты data/work/batches/b-NNN.jsonl.
// Запуск: node scripts/translate/prepare.mjs [--max-chars 9000] [--max-items 100]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readJsonl } from './lib.mjs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? Number(process.argv[i + 1]) : fallback;
};
const MAX_CHARS = arg('--max-chars', 9000);
const MAX_ITEMS = arg('--max-items', 100);

const rows = readJsonl('data/translation_input.jsonl').sort((a, b) => a.id - b.id);
const batches = [];
let current = [];
let chars = 0;
for (const row of rows) {
  if (current.length > 0 && (chars + row.text.length > MAX_CHARS || current.length >= MAX_ITEMS)) {
    batches.push(current);
    current = [];
    chars = 0;
  }
  current.push(row);
  chars += row.text.length;
}
if (current.length > 0) batches.push(current);

const dir = 'data/work/batches';
mkdirSync(dir, { recursive: true });
const manifest = batches.map((batch, i) => {
  const name = `b-${String(i + 1).padStart(3, '0')}`;
  writeFileSync(join(dir, `${name}.jsonl`), batch.map((r) => JSON.stringify(r)).join('\n') + '\n');
  return { name, count: batch.length, chars: batch.reduce((s, r) => s + r.text.length, 0) };
});
writeFileSync('data/work/manifest.json', JSON.stringify(manifest, null, 1));
console.log(
  `Пакетов: ${manifest.length}; отзывов: ${rows.length}; знаков: ${manifest.reduce((s, b) => s + b.chars, 0)}`,
);
