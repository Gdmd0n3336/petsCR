// Частичная выгрузка TASK-T (решение Макса 2026-10-20: остановиться на готовом, остальное перевести перед продом).
// Запуск: node scripts/translate/export-partial.mjs
// Берёт только пакеты data/work/out/b-NNN.json, которые целиком проходят проверки 1–2 (как check-batch.mjs),
// и пишет в data/:
//   translations_import.csv      — source_url,text_ru,text_en только для переведённых отзывов (все поля в кавычках)
//   translations_out.jsonl       — те же строки с id и uncertain
//   translations_remaining.json  — непереведённые пакеты и id (для продолжения)
//   translation_report.json      — проверки 1–4 по выгруженным строкам; проверка 5 не выполнялась
// Перевод на язык оригинала (need_* = false) в выгрузку не попадает.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  csvRow,
  lengthRatio,
  RATIO_MAX,
  RATIO_MIN,
  RATIO_MIN_ORIGINAL,
  readJsonl,
  rowProblems,
} from './lib.mjs';

const manifest = JSON.parse(readFileSync('data/work/manifest.json', 'utf8'));
const done = [];
const remaining = [];
const exported = [];
const batchProblems = {};

for (const { name } of manifest) {
  const input = readJsonl(`data/work/batches/${name}.jsonl`);
  const path = `data/work/out/${name}.json`;
  if (!existsSync(path)) {
    remaining.push({ name, ids: input.map((r) => r.id) });
    continue;
  }
  let out;
  try {
    out = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    remaining.push({ name, ids: input.map((r) => r.id), reason: 'файл не JSON' });
    continue;
  }
  const byId = new Map(out.map((o) => [o.id, o]));
  const problems = input.flatMap((r) =>
    rowProblems(r, byId.get(r.id))
      .filter((p) => !p.includes('должен быть пустым'))
      .map((p) => `id ${r.id}: ${p}`),
  );
  if (problems.length) {
    batchProblems[name] = problems;
    remaining.push({ name, ids: input.map((r) => r.id), reason: 'не прошёл проверки 1–2' });
    continue;
  }
  done.push(name);
  for (const r of input) {
    const o = byId.get(r.id);
    exported.push({
      r,
      text_ru: r.need_ru ? o.text_ru : '',
      text_en: r.need_en ? o.text_en : '',
      uncertain: o.uncertain === true,
    });
  }
}

// Проверка 3 (длина) и 4 (дубли длинных переводов) по выгруженным строкам
const outliers = [];
for (const e of exported) {
  if (e.r.text.length < RATIO_MIN_ORIGINAL) continue;
  for (const [lang, text] of [
    ['ru', e.text_ru],
    ['en', e.text_en],
  ]) {
    if (!text) continue;
    const ratio = lengthRatio(text, e.r.text);
    if (ratio < RATIO_MIN || ratio > RATIO_MAX)
      outliers.push({ id: e.r.id, lang, origLang: e.r.lang, ratio: Number(ratio.toFixed(2)) });
  }
}
const duplicates = [];
for (const lang of ['ru', 'en']) {
  const groups = new Map();
  for (const e of exported) {
    const text = lang === 'ru' ? e.text_ru : e.text_en;
    if (text.length <= 40) continue;
    groups.set(text, [...(groups.get(text) ?? []), e]);
  }
  for (const [, list] of groups)
    if (list.length > 1 && new Set(list.map((e) => e.r.text)).size > 1)
      duplicates.push({ lang, ids: list.map((e) => e.r.id) });
}
const noLetters = (t) => (t.match(/\p{L}/gu) ?? []).length === 0;
const noLetterChanged = exported.filter(
  (e) =>
    noLetters(e.r.text) &&
    ((e.r.need_ru && e.text_ru !== e.r.text) || (e.r.need_en && e.text_en !== e.r.text)),
);

writeFileSync(
  'data/translations_import.csv',
  [csvRow(['source_url', 'text_ru', 'text_en'])]
    .concat(exported.map((e) => csvRow([e.r.source_url, e.text_ru, e.text_en])))
    .join('\n') + '\n',
);
writeFileSync(
  'data/translations_out.jsonl',
  exported
    .map((e) =>
      JSON.stringify({
        id: e.r.id,
        source_url: e.r.source_url,
        text_ru: e.text_ru,
        text_en: e.text_en,
        uncertain: e.uncertain,
      }),
    )
    .join('\n') + '\n',
);
const remainingIds = remaining.flatMap((b) => b.ids);
writeFileSync(
  'data/translations_remaining.json',
  JSON.stringify(
    { batches: remaining.map((b) => b.name), count: remainingIds.length, ids: remainingIds },
    null,
    1,
  ) + '\n',
);

const report = {
  batches: { total: manifest.length, exported: done.length, remaining: remaining.length },
  rows: {
    input: manifest.reduce((s, b) => s + b.count, 0),
    exported: exported.length,
    remaining: remainingIds.length,
    exportedRu: exported.filter((e) => e.text_ru).length,
    exportedEn: exported.filter((e) => e.text_en).length,
  },
  check1and2: { failedBatches: batchProblems },
  check3: { outliers: outliers.length, examples: outliers.slice(0, 10) },
  check4: { groupsWithDifferentOriginals: duplicates.length, examples: duplicates.slice(0, 10) },
  noLetterTexts: exported.filter((e) => noLetters(e.r.text)).length,
  noLetterChanged: noLetterChanged.map((e) => e.r.id),
  uncertain: exported.filter((e) => e.uncertain).length,
  check5: 'не выполнялась: прогон остановлен по решению Макса до второго прохода (смысл и тон)',
};
writeFileSync('data/translation_report.json', JSON.stringify(report, null, 1) + '\n');
console.log(JSON.stringify(report, null, 1));
