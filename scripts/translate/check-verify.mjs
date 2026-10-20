// Проверка файла вердиктов второго прохода (проверка 5): data/work/<папка>/<пакет>.json
// Запуск: node scripts/translate/check-verify.mjs b-001 [verify|reverify]
// Для verify вердикт нужен по каждому id пакета; для reverify — по каждому id из списка исправленных.
import { existsSync, readFileSync } from 'node:fs';
import { readJsonl } from './lib.mjs';

const [name, kind = 'verify'] = process.argv.slice(2);
if (!name || !/^b-\d{3}$/.test(name) || !['verify', 'reverify'].includes(kind)) {
  console.error('Использование: node scripts/translate/check-verify.mjs b-001 [verify|reverify]');
  process.exit(2);
}
const path = `data/work/${kind}/${name}.json`;
if (!existsSync(path)) {
  console.error(`Нет файла ${path}`);
  process.exit(1);
}
let verdicts;
try {
  verdicts = JSON.parse(readFileSync(path, 'utf8'));
} catch (error) {
  console.error(`${path}: не JSON (${error.message})`);
  process.exit(1);
}
const expected =
  kind === 'verify'
    ? readJsonl(`data/work/batches/${name}.jsonl`).map((r) => r.id)
    : JSON.parse(readFileSync(`data/work/fix/${name}.json`, 'utf8')).map((r) => r.id);

const problems = [];
const seen = new Set();
for (const v of Array.isArray(verdicts) ? verdicts : []) {
  if (seen.has(v.id)) problems.push(`id ${v.id}: повтор`);
  seen.add(v.id);
  if (v.verdict !== 'yes' && v.verdict !== 'no')
    problems.push(`id ${v.id}: verdict должен быть "yes" или "no"`);
  if (v.verdict === 'no' && !(typeof v.reason === 'string' && v.reason.trim()))
    problems.push(`id ${v.id}: для "no" нужна причина`);
}
if (!Array.isArray(verdicts)) problems.push('ожидается JSON-массив');
for (const id of expected) if (!seen.has(id)) problems.push(`id ${id}: нет вердикта`);
for (const id of seen) if (!expected.includes(id)) problems.push(`id ${id}: лишний`);

if (problems.length > 0) {
  console.error(`${name} ${kind}: проблем ${problems.length}\n${problems.join('\n')}`);
  process.exit(1);
}
const no = verdicts.filter((v) => v.verdict === 'no').length;
console.log(`${name} ${kind}: OK, вердиктов ${verdicts.length}, "no": ${no}`);
