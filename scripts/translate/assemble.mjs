// Сборка и проверки 1–5 TASK-T. Запуск: node scripts/translate/assemble.mjs
// Вход: data/translation_input.jsonl, data/work/out/*.json (переводы), data/work/verify/*.json и
// data/work/reverify/*.json (вердикты второго прохода). Выход (всё в data/, вне git):
//   translations_out.jsonl, translations_import.csv, translation_review_sample.csv, translation_report.json
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  csvRow,
  languageOk,
  lengthRatio,
  RATIO_MAX,
  RATIO_MIN,
  RATIO_MIN_ORIGINAL,
  readJsonl,
  rowProblems,
  seededSample,
} from './lib.mjs';

const readJsonDir = (dir) =>
  existsSync(dir)
    ? readdirSync(dir)
        .filter((f) => f.endsWith('.json'))
        .sort()
        .flatMap((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')))
    : [];

const input = readJsonl('data/translation_input.jsonl');
const inputById = new Map(input.map((r) => [r.id, r]));
const outRows = readJsonDir('data/work/out');
const outById = new Map();
const duplicateOutIds = [];
for (const row of outRows) {
  if (outById.has(row.id)) duplicateOutIds.push(row.id);
  outById.set(row.id, row);
}

// ---- Проверка 1: строки ----
const extraIds = [...outById.keys()].filter((id) => !inputById.has(id));
const rowFailures = [];
for (const row of input) {
  const problems = rowProblems(row, outById.get(row.id));
  if (problems.length) rowFailures.push({ id: row.id, problems });
}
const check1 = {
  input: input.length,
  output: outById.size,
  duplicateOutIds,
  extraIds,
  needRu: input.filter((r) => r.need_ru).length,
  needEn: input.filter((r) => r.need_en).length,
  failures: rowFailures.filter((f) => f.problems.some((p) => !p.includes('80%'))),
  sourceUrl:
    'source_url берётся из входа по id: переводчики его не копируют, поэтому совпадает всегда',
};

// ---- Проверка 2: язык ----
const check2 = { failures: rowFailures.filter((f) => f.problems.some((p) => p.includes('80%'))) };

// ---- Проверка 3: длина ----
const outliers = [];
for (const row of input) {
  const out = outById.get(row.id);
  if (!out || row.text.length < RATIO_MIN_ORIGINAL) continue;
  for (const lang of ['ru', 'en']) {
    const text = lang === 'ru' ? out.text_ru : out.text_en;
    if (!text) continue;
    const ratio = lengthRatio(text, row.text);
    if (ratio < RATIO_MIN || ratio > RATIO_MAX)
      outliers.push({ id: row.id, lang, origLang: row.lang, ratio: Number(ratio.toFixed(2)) });
  }
}
const thaiOutliers = outliers.filter((o) => o.origLang === 'th');

// ---- Проверка 4: дубли длинных переводов у разных отзывов ----
const duplicates = [];
for (const lang of ['ru', 'en']) {
  const groups = new Map();
  for (const out of outById.values()) {
    const text = (lang === 'ru' ? out.text_ru : out.text_en) ?? '';
    if (text.length <= 40) continue;
    if (!groups.has(text)) groups.set(text, []);
    groups.get(text).push(out.id);
  }
  for (const [text, ids] of groups) {
    if (ids.length < 2) continue;
    const originals = new Set(ids.map((id) => inputById.get(id)?.text));
    duplicates.push({ lang, ids, sameOriginal: originals.size === 1, text: text.slice(0, 80) });
  }
}

// ---- Проверка 5: смысл и тон (второй независимый проход) ----
const verdict = new Map();
for (const v of readJsonDir('data/work/verify')) verdict.set(v.id, v);
const firstPassNo = [...verdict.values()].filter((v) => v.verdict === 'no').map((v) => v.id);
for (const v of readJsonDir('data/work/reverify')) verdict.set(v.id, v); // последний вердикт побеждает
const missingVerdicts = input.filter((r) => !verdict.has(r.id)).map((r) => r.id);
const finalNo = [...verdict.values()].filter((v) => v.verdict === 'no');
const byRating = (ids, ratings) =>
  ids.filter((id) => ratings.includes(inputById.get(id)?.rating)).length;
const check5 = {
  verified: verdict.size,
  missingVerdicts,
  firstPassNo: firstPassNo.length,
  firstPassNoRating12: byRating(firstPassNo, [1, 2]),
  firstPassNoRating5: byRating(firstPassNo, [5]),
  retranslated: readJsonDir('data/work/fix').length,
  finalNo: finalNo.length,
  finalNoShare: Number(((finalNo.length / input.length) * 100).toFixed(2)),
  finalNoList: finalNo.map((v) => ({
    id: v.id,
    rating: inputById.get(v.id)?.rating,
    reason: v.reason,
  })),
};

// ---- Выходные файлы ----
const uncertainIds = input.filter((r) => outById.get(r.id)?.uncertain === true).map((r) => r.id);
writeFileSync(
  'data/translations_out.jsonl',
  input
    .map((r) => {
      const o = outById.get(r.id) ?? {};
      return JSON.stringify({
        id: r.id,
        source_url: r.source_url,
        text_ru: r.need_ru ? (o.text_ru ?? '') : '',
        text_en: r.need_en ? (o.text_en ?? '') : '',
        uncertain: o.uncertain === true,
      });
    })
    .join('\n') + '\n',
);
writeFileSync(
  'data/translations_import.csv',
  [csvRow(['source_url', 'text_ru', 'text_en'])]
    .concat(
      input.map((r) => {
        const o = outById.get(r.id) ?? {};
        return csvRow([r.source_url, r.need_ru ? o.text_ru : '', r.need_en ? o.text_en : '']);
      }),
    )
    .join('\n') + '\n',
);

const flagged = new Map();
const flag = (id, why) => flagged.set(id, [...(flagged.get(id) ?? []), why]);
for (const id of seededSample(
  input.map((r) => r.id),
  100,
  20261020,
))
  flag(id, 'случайная выборка');
for (const id of uncertainIds) flag(id, 'uncertain');
for (const o of outliers) flag(o.id, `длина ${o.lang} ${o.ratio}`);
for (const d of duplicates) for (const id of d.ids) flag(id, `дубль ${d.lang}`);
for (const v of finalNo) flag(v.id, `тон/смысл: ${v.reason}`);
writeFileSync(
  'data/translation_review_sample.csv',
  [csvRow(['id', 'source_url', 'rating', 'lang', 'original', 'text_ru', 'text_en', 'why'])]
    .concat(
      [...flagged.keys()]
        .sort((a, b) => a - b)
        .map((id) => {
          const r = inputById.get(id);
          const o = outById.get(id) ?? {};
          return csvRow([
            id,
            r.source_url,
            r.rating,
            r.lang,
            r.text,
            o.text_ru,
            o.text_en,
            flagged.get(id).join('; '),
          ]);
        }),
    )
    .join('\n') + '\n',
);

const report = {
  check1: {
    ...check1,
    failures: check1.failures.length,
    failureExamples: check1.failures.slice(0, 10),
  },
  check2: { failures: check2.failures.length, failureExamples: check2.failures.slice(0, 10) },
  check3: {
    outliers: outliers.length,
    thaiOutliers: thaiOutliers.length,
    examples: outliers.slice(0, 10),
    bounds: `${RATIO_MIN}–${RATIO_MAX}, оригинал ≥ ${RATIO_MIN_ORIGINAL} знаков`,
  },
  check4: {
    groups: duplicates.length,
    differentOriginals: duplicates.filter((d) => !d.sameOriginal).length,
    examples: duplicates.slice(0, 10),
  },
  check5,
  uncertain: uncertainIds.length,
  reviewSample: flagged.size,
  sanityLanguage: {
    ruOk: input.filter((r) => r.need_ru && languageOk(outById.get(r.id)?.text_ru ?? '', 'ru'))
      .length,
    enOk: input.filter((r) => r.need_en && languageOk(outById.get(r.id)?.text_en ?? '', 'en'))
      .length,
  },
};
writeFileSync('data/translation_report.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
