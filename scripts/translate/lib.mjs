// TASK-T: общие функции подготовки, проверки и сборки переводов отзывов.
// Данные (пакеты, переводы, результаты) лежат в data/ — эта папка в .gitignore.
import { readFileSync } from 'node:fs';

export const LETTER = /\p{L}/gu;
const CYRILLIC = /\p{Script=Cyrillic}/gu;
const LATIN = /\p{Script=Latin}/gu;

/** @param {string} path */
export const readJsonl = (path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line));

/** @param {string} text @param {RegExp} script — доля букв нужного алфавита среди всех букв (null, если букв нет). */
export function scriptShare(text, script) {
  const letters = text.match(LETTER)?.length ?? 0;
  if (letters === 0) return null;
  return (text.match(script)?.length ?? 0) / letters;
}

/**
 * Проверка 2: русский ≥ 80% кириллицы среди букв, английский ≥ 80% латиницы.
 * Исключение: в тексте нет букв вообще (только эмодзи, цифры, знаки).
 * @param {string} text @param {'ru'|'en'} lang
 */
export function languageOk(text, lang) {
  const share = scriptShare(text, lang === 'ru' ? CYRILLIC : LATIN);
  return share === null || share >= 0.8;
}

/** Проверка 3: отношение длины перевода к оригиналу (по знакам). */
export const lengthRatio = (translation, original) =>
  original.length === 0 ? 0 : translation.length / original.length;

export const RATIO_MIN = 0.4;
export const RATIO_MAX = 2.5;
/** Отношение длины проверяем только для оригиналов длиннее этого порога: у «ดี» → «Хорошо» оно всегда «выброс». */
export const RATIO_MIN_ORIGINAL = 20;

/**
 * Проверка одного перевода против входной строки. Возвращает список проблем (пустой — всё в порядке).
 * @param {{id:number, need_ru:boolean, need_en:boolean}} input
 * @param {{id:number, text_ru?:string, text_en?:string, uncertain?:boolean} | undefined} out
 */
export function rowProblems(input, out) {
  if (!out) return ['нет перевода'];
  const problems = [];
  for (const lang of /** @type {const} */ (['ru', 'en'])) {
    const need = lang === 'ru' ? input.need_ru : input.need_en;
    const text = (lang === 'ru' ? out.text_ru : out.text_en) ?? '';
    if (typeof text !== 'string') problems.push(`text_${lang} не строка`);
    else if (need && text.trim() === '') problems.push(`пустой text_${lang}`);
    else if (!need && text !== '')
      problems.push(`text_${lang} должен быть пустым (оригинал на этом языке)`);
    else if (need && !languageOk(text, lang))
      problems.push(
        `text_${lang}: меньше 80% ${lang === 'ru' ? 'кириллицы' : 'латиницы'} среди букв`,
      );
  }
  if (typeof out.uncertain !== 'boolean') problems.push('uncertain должен быть true/false');
  return problems;
}

/** CSV: все поля в кавычках, кавычки удваиваются (RFC 4180). */
export const csvRow = (fields) =>
  fields.map((f) => `"${String(f ?? '').replaceAll('"', '""')}"`).join(',');

/** Детерминированная псевдослучайная выборка (mulberry32), чтобы выборка воспроизводилась. */
export function seededSample(items, count, seed) {
  let s = seed >>> 0;
  const rand = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
