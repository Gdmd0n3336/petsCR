// Проверка собранного dist/ (запускается в CI после сборки без переменных окружения):
// 1) нет строк, похожих на ключ Google (AIza…), и адресов проекта Supabase;
// 2) образец данных (fixtures) не попал в основной чанк и лежит отдельным файлом;
// 3) шрифты только свои: нет обращений к Google Fonts, есть нужные подмножества Inter и Noto Sans Thai.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const GOOGLE_KEY = /AIza[0-9A-Za-z_-]{35}/;
export const SUPABASE_HOST = /[a-z0-9]{20}\.supabase\.co/;
// Шрифты только свои (design/DESIGN.md §3): никаких запросов к Google Fonts.
export const GOOGLE_FONTS = /fonts\.(googleapis|gstatic)\.com/;
// Нужные подмножества шрифтов: Inter latin и cyrillic, Noto Sans Thai thai.
export const REQUIRED_FONTS = [
  'inter-latin-wght-normal',
  'inter-cyrillic-wght-normal',
  'noto-sans-thai-thai-wght-normal',
];
// id отзыва из fixtures/catalog.sample.json: есть только в чанке с образцом данных.
export const SAMPLE_MARKER = 'ade86fe0-92ce-5f34-b7df-42c973361822';

/** files: { имя: содержимое }; entry — имя основного чанка. Возвращает список проблем. */
export function findProblems(files, entry) {
  const problems = [];
  for (const [name, text] of Object.entries(files)) {
    if (GOOGLE_KEY.test(text)) problems.push(`${name}: looks like a Google API key`);
    if (SUPABASE_HOST.test(text)) problems.push(`${name}: contains a Supabase project URL`);
    if (GOOGLE_FONTS.test(text)) problems.push(`${name}: requests Google Fonts`);
  }
  if (entry && files[entry]?.includes(SAMPLE_MARKER)) {
    problems.push(`${entry}: sample data is inside the main chunk`);
  }
  return problems;
}

/** Файлы шрифтов в сборке: все нужные подмножества на месте, лишних семейств нет. */
export function findFontProblems(fileNames) {
  const fonts = fileNames.filter((n) => n.endsWith('.woff2'));
  const problems = REQUIRED_FONTS.filter((f) => !fonts.some((n) => n.includes(f))).map(
    (f) => `font missing: ${f}`,
  );
  for (const n of fonts) {
    if (!REQUIRED_FONTS.some((f) => n.includes(f))) problems.push(`unexpected font file: ${n}`);
  }
  return problems;
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory() ? listFiles(join(dir, item.name)) : [item.name],
  );
}

function readDist(dir) {
  const files = {};
  const walk = (path) => {
    for (const item of readdirSync(path, { withFileTypes: true })) {
      const full = join(path, item.name);
      if (item.isDirectory()) walk(full);
      else if (/\.(js|css|html|json|map)$/.test(item.name))
        files[full] = readFileSync(full, 'utf8');
    }
  };
  walk(dir);
  return files;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dist = process.argv[2] ?? 'dist';
  const files = readDist(dist);
  const html = files[join(dist, 'index.html')] ?? '';
  const entryName = html.match(/src="\/?(assets\/index-[^"]+\.js)"/)?.[1];
  const entry = entryName ? join(dist, entryName) : undefined;
  const problems = [...findProblems(files, entry), ...findFontProblems(listFiles(dist))];
  if (!entry) problems.push('main chunk not found in index.html');
  else if (!Object.values(files).some((text) => text.includes(SAMPLE_MARKER))) {
    problems.push('sample data chunk not found');
  }
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(
    `check-bundle: ${Object.keys(files).length} files, no keys, no Google Fonts, fonts: ${REQUIRED_FONTS.join(', ')}, sample data in a separate chunk`,
  );
}
