// Проверка одного пакета переводов (для подагента-переводчика и для сборки).
// Запуск: node scripts/translate/check-batch.mjs b-001
// Сверяет data/work/out/<пакет>.json с data/work/batches/<пакет>.jsonl: все id на месте, нужные языки
// не пусты, ненужные пусты, язык по доле букв (проверки 1–2 задачи). Код выхода 1, если есть проблемы.
import { existsSync, readFileSync } from 'node:fs';
import { readJsonl, rowProblems } from './lib.mjs';

const name = process.argv[2];
if (!name || !/^b-\d{3}$/.test(name)) {
  console.error('Использование: node scripts/translate/check-batch.mjs b-001');
  process.exit(2);
}
const input = readJsonl(`data/work/batches/${name}.jsonl`);
const outPath = `data/work/out/${name}.json`;
if (!existsSync(outPath)) {
  console.error(`Нет файла ${outPath}`);
  process.exit(1);
}

let out;
try {
  out = JSON.parse(readFileSync(outPath, 'utf8'));
} catch (error) {
  console.error(`${outPath}: не JSON (${error.message})`);
  process.exit(1);
}
if (!Array.isArray(out)) {
  console.error(`${outPath}: ожидается JSON-массив`);
  process.exit(1);
}

const problems = [];
const byId = new Map();
for (const row of out) {
  if (byId.has(row.id)) problems.push(`id ${row.id}: повтор`);
  byId.set(row.id, row);
}
const inputIds = new Set(input.map((r) => r.id));
for (const id of byId.keys())
  if (!inputIds.has(id)) problems.push(`id ${id}: лишний, нет во входе`);
for (const row of input) {
  for (const p of rowProblems(row, byId.get(row.id))) problems.push(`id ${row.id}: ${p}`);
}

if (problems.length > 0) {
  console.error(`${name}: проблем ${problems.length}\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`${name}: OK, ${input.length} из ${input.length}`);
