// Названия заведений (часть 2 TASK-T).
//   node scripts/translate/venues.mjs check 1   — проверить data/work/venues/v-1.json (строки 1–83 входа)
//   node scripts/translate/venues.mjs check 2   — проверить data/work/venues/v-2.json (строки 84–165)
//   node scripts/translate/venues.mjs assemble  — собрать data/venue_names.json и вывести итоги
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { languageOk, readJsonl } from './lib.mjs';

const input = readJsonl('data/venue_names_input.jsonl');
const HALF = Math.ceil(input.length / 2);
const part = (n) => (n === 1 ? input.slice(0, HALF) : input.slice(HALF));

function problemsFor(expected, out) {
  const problems = [];
  if (!Array.isArray(out)) return ['ожидается JSON-массив'];
  const byId = new Map();
  for (const v of out) {
    if (byId.has(v.google_place_id)) problems.push(`${v.google_place_id}: повтор`);
    byId.set(v.google_place_id, v);
  }
  const ids = new Set(expected.map((v) => v.google_place_id));
  for (const id of byId.keys()) if (!ids.has(id)) problems.push(`${id}: лишний`);
  for (const v of expected) {
    const o = byId.get(v.google_place_id);
    if (!o) {
      problems.push(`${v.google_place_id}: нет записи`);
      continue;
    }
    if (!o.name_ru?.trim()) problems.push(`${v.google_place_id}: пустой name_ru`);
    else if (!languageOk(o.name_ru, 'ru'))
      problems.push(`${v.google_place_id}: name_ru меньше 80% кириллицы`);
    if (!o.name_en?.trim()) problems.push(`${v.google_place_id}: пустой name_en`);
    else if (!languageOk(o.name_en, 'en'))
      problems.push(`${v.google_place_id}: name_en меньше 80% латиницы`);
    if (typeof o.uncertain !== 'boolean')
      problems.push(`${v.google_place_id}: uncertain должен быть true/false`);
  }
  return problems;
}

const read = (n) => {
  const path = `data/work/venues/v-${n}.json`;
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
};

const [command, arg] = process.argv.slice(2);
if (command === 'check' && (arg === '1' || arg === '2')) {
  const n = Number(arg);
  const out = read(n);
  const problems =
    out === null ? [`нет файла data/work/venues/v-${n}.json`] : problemsFor(part(n), out);
  if (problems.length) {
    console.error(`v-${n}: проблем ${problems.length}\n${problems.join('\n')}`);
    process.exit(1);
  }
  console.log(`v-${n}: OK, ${part(n).length} из ${part(n).length}`);
} else if (command === 'assemble') {
  const all = [...(read(1) ?? []), ...(read(2) ?? [])];
  const problems = problemsFor(input, all);
  const order = new Map(input.map((v, i) => [v.google_place_id, i]));
  const result = all
    .sort((a, b) => order.get(a.google_place_id) - order.get(b.google_place_id))
    .map(({ google_place_id, name_ru, name_en, uncertain }) => ({
      google_place_id,
      name_ru,
      name_en,
      uncertain,
    }));
  writeFileSync('data/venue_names.json', JSON.stringify(result, null, 1) + '\n');
  console.log(
    JSON.stringify(
      {
        input: input.length,
        output: result.length,
        problems: problems.length,
        problemList: problems,
        uncertain: result.filter((v) => v.uncertain).length,
      },
      null,
      1,
    ),
  );
  if (problems.length) process.exit(1);
} else {
  console.error('Использование: node scripts/translate/venues.mjs check 1|2 | assemble');
  process.exit(2);
}
