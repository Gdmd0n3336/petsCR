// Импорт заведений из экспорта Overpass Turbo в SQL для public.venues_import (TASK-03).
// Запуск: npm run import:osm -- --from-file <export.json> [--out-dir <каталог вне репозитория>]
// Скрипт не ходит в сеть и не подключается к базе: SQL-файл выполняют вручную в SQL Editor.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CATEGORIES, type Category, ImportFormatError, parseOverpass, summarize } from './parse.ts';
import { buildUpsertSql } from './sql.ts';

export type RunIO = {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  repoRoot: string;
  homeDir: string;
  now: Date;
};

const USAGE =
  'Использование: npm run import:osm -- --from-file <export.json> [--out-dir <каталог>]';
const SQL_FILE = 'venues_import_upsert.sql';

const LABELS: Record<Category, string> = {
  vet_clinic: 'ветклиники',
  grooming: 'груминг',
  boarding: 'передержки',
  pet_shop: 'зоомагазины',
};

function parseArgs(argv: string[]): { fromFile?: string; outDir?: string } {
  const args: { fromFile?: string; outDir?: string } = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--from-file') args.fromFile = argv[++i];
    else if (argv[i] === '--out-dir') args.outDir = argv[++i];
  }
  return args;
}

/** Реальный путь даже для ещё не созданного каталога: ближайший существующий предок + остаток. */
function realPath(path: string): string {
  let existing = resolve(path);
  const rest: string[] = [];
  while (!existsSync(existing)) {
    rest.unshift(basename(existing));
    const parent = dirname(existing);
    if (parent === existing) break;
    existing = parent;
  }
  return join(realpathSync(existing), ...rest);
}

function isInside(child: string, parent: string): boolean {
  const rel = relative(realPath(parent), realPath(child));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

export function run(argv: string[], io: RunIO): number {
  const { fromFile, outDir: outDirArg } = parseArgs(argv);
  if (!fromFile) {
    io.stderr(`Не указан файл экспорта (--from-file). ${USAGE}`);
    return 1;
  }
  const inputPath = resolve(fromFile);
  if (!existsSync(inputPath)) {
    io.stderr(`Файл не найден: ${inputPath}`);
    return 1;
  }
  if (!statSync(inputPath).isFile()) {
    io.stderr(`Указана папка, а не файл: ${inputPath}. ${USAGE}`);
    return 1;
  }

  const outDir = resolve(outDirArg ?? join(io.homeDir, 'lapa-osm-import'));
  if (isInside(outDir, io.repoRoot)) {
    io.stderr(
      `Каталог вывода ${outDir} внутри репозитория. SQL с данными нельзя класть в репозиторий: укажите --out-dir вне ${io.repoRoot}.`,
    );
    return 1;
  }

  let parsed;
  try {
    parsed = parseOverpass(readFileSync(inputPath, 'utf8'));
  } catch (error) {
    if (error instanceof ImportFormatError) {
      io.stderr(`Ошибка формата файла ${inputPath}: ${error.message}`);
      return 1;
    }
    throw error;
  }

  const { rows, osmTimestamp, stats } = parsed;
  const summary = summarize(rows);
  const sqlPath = join(outDir, SQL_FILE);
  const date = io.now.toISOString().slice(0, 10);
  const logPath = join(outDir, `import-log-${date}.txt`);

  const table = [
    `${'Категория'.padEnd(24)}${'всего'.padStart(7)}${'с телефоном'.padStart(13)}${'с часами'.padStart(10)}${'без названия'.padStart(14)}`,
    ...CATEGORIES.map((c) => {
      const s = summary[c];
      return `${`${c} ${LABELS[c]}`.padEnd(24)}${String(s.total).padStart(7)}${String(s.withPhone).padStart(13)}${String(s.withHours).padStart(10)}${String(s.withoutName).padStart(14)}`;
    }),
  ];
  const log = [
    `Lapa · импорт OSM · ${io.now.toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    `Файл: ${inputPath}`,
    `Время данных OSM: ${osmTimestamp ?? 'не указано в файле'}`,
    `Элементов в файле: ${stats.elements} (node ${stats.byType.node}, way ${stats.byType.way}, relation ${stats.byType.relation})`,
    `Дублей в файле: ${stats.duplicates}; без координат: ${stats.withoutCoordinates}; без нужных тегов: ${stats.withoutMatchingTags}`,
    ...(stats.withoutCoordinates > 0
      ? ['Внимание: у части объектов нет координат — в запросе Overpass нужен `out center tags`.']
      : []),
    ...table,
    `Итого к загрузке: ${rows.length}`,
    `SQL для SQL Editor: ${sqlPath}`,
    `Журнал: ${logPath}`,
    'Данные © участники OpenStreetMap, лицензия ODbL.',
  ].join('\n');

  mkdirSync(outDir, { recursive: true });
  writeFileSync(sqlPath, buildUpsertSql(rows, { inputName: basename(inputPath), osmTimestamp }));
  writeFileSync(logPath, `${log}\n`);
  io.stdout(log);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = run(process.argv.slice(2), {
    stdout: (line) => console.log(line),
    stderr: (line) => console.error(line),
    repoRoot: fileURLToPath(new URL('../../', import.meta.url)),
    homeDir: homedir(),
    now: new Date(),
  });
}
