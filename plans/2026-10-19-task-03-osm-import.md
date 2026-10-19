# Plan: TASK-03 импорт заведений из OpenStreetMap
**Spec:** specs/2026-10-19-task-03-osm-import.md
**Research:** thoughts/research/2026-10-19-task-03-osm-import.md
**Status:** planning
**Branch:** `feature/task-03-osm-import` (от `main` после слияния TASK-01/02). PR — только по команде Макса.

## Как это работает (одним абзацем)
Макс запускает у себя `npm run import:osm`. Скрипт делает **один** запрос к Overpass (с паузой и повтором при сбое), сохраняет сырой ответ в файл **вне репозитория**, печатает журнал с числами по категориям и пишет рядом файл `venues_import_upsert.sql`. Макс открывает SQL Editor Supabase и выполняет этот файл — так же, как применяет миграции. Скрипт ничего не знает о ключах и к базе не подключается. Повторный запуск (`--from-file`) берёт данные из сохранённого файла, без сети; повторное выполнение SQL не создаёт дублей и не трогает статусы.

## Challenge Log

### Решение 1. Как скрипт получает доступ к базе без `service_role` в репозитории и клиентском коде

| Вариант | Как | Плюсы | Минусы |
|---|---|---|---|
| **A. Генерация SQL-файла (рекомендую)** | скрипт пишет `venues_import_upsert.sql`, Макс выполняет его в SQL Editor | никаких секретов нигде; тот же контролируемый путь, что и миграции; SQL можно прочитать до запуска | ручной шаг; очень большой файл SQL Editor может не принять (для сотен строк не актуально) |
| B. Отдельная роль Postgres | миграция создаёт роль `osm_importer` с `insert, update` только на `venues_import`; строка подключения в локальном `.env.local` (в `.gitignore`); скрипт пишет через драйвер `pg` | автоматический upsert; минимальные права | новая зависимость; пароль роли надо создать, хранить и менять; прямое подключение к базе с ноутбука |
| C. `service_role` в локальном `.env.local` | supabase-js с ключом из env только на машине Макса | быстро | ключ даёт полный доступ ко всей базе, обходит RLS; утечка (лог, скриншот, случайный коммит) = компрометация проекта. Не рекомендую |
| D. Edge Function с секретом | скрипт шлёт данные в функцию, ключ в секретах Supabase | ключ только на сервере | нужно писать и защищать функцию (авторизация вызова) ради разовой загрузки — избыточно |

**Рекомендация: A.** Разовая загрузка сотен строк не оправдывает хранения какого-либо доступа к базе; SQL-файл проверяем глазами и тестом. Если импорт станет регулярным — переходим на B (отдельная задача).

### Решение 2. Безопасная передача данных OSM в SQL
Теги OSM — недоверенные данные. Никакой склейки значений в SQL: весь массив записей сериализуется **одной JSON-строкой** в SQL-литерал (экранирование одно — `'` → `''`), разбор делает Postgres через `jsonb_to_recordset(...)`. Проверено на PGlite в scratchpad: тег `O'Reilly $$ ; -- \ \n` сохранился без изменений, SQL не сломался.
Альтернативы: dollar-quoting `$tag$…$tag$` (нужно гарантировать отсутствие тега в данных — хрупко); построчные `values (...)` с экранированием каждого поля (больше мест для ошибки). Отклонены.

### Решение 3. Идемпотентность и сохранение решений
`insert … on conflict (osm_type, osm_id) do update set tags, lat, lng, category, last_seen_at = now()`. **Не обновляются** `status` (решение человека) и `imported_at` (дата первого импорта). Объекты, исчезнувшие из OSM, не удаляются (решение в TASK-04, у них просто не обновится `last_seen_at`).
Колонка `last_seen_at` — **добавлено** к полям из `TASKS.md`: без неё при повторном импорте не видно, какие объекты пропали из OSM.

### Решение 4. Приоритет категорий
Если у объекта несколько подходящих тегов: `amenity=veterinary` → `vet_clinic` > `amenity=animal_boarding` → `boarding` > `shop=pet_grooming` → `grooming` > `shop=pet` → `pet_shop`. Причина: медицинская помощь важнее для пользователя (SOS), передержка — отдельная услуга, зоомагазин с грумингом чаще всего магазин. Все варианты тегов остаются в `tags`, человек может поправить в TASK-04.

### Решение 5. Запрос и сеть
Запрос (сверено: OSM wiki «Overpass QL», «Advanced examples», «Language Guide», Context7):
```
[out:json][timeout:120];
area["ISO3166-2"="TH-20"]->.p;
(
  nwr["amenity"="veterinary"](area.p);
  nwr["shop"="pet_grooming"](area.p);
  nwr["amenity"="animal_boarding"](area.p);
  nwr["shop"="pet"](area.p);
);
out center tags;
```
- Серверы по очереди, **никогда параллельно**: `https://overpass-api.de/api/interpreter`, затем запасной `https://overpass.private.coffee/api/interpreter` (без лимитов по OSM wiki). Флаг `--server <url>` для явного выбора.
- Повтор: до 3 попыток на сервер; пауза 30 с (политика: при 429/406 ждать 30 с), то же для 5xx, сетевой ошибки, таймаута (`AbortSignal.timeout(180 s)`) и ответа с «too busy»/`runtime error`. Пауза и попытки — параметры функции (в тестах пауза 0).
- `User-Agent: lapa-osm-import/1.0 (+https://github.com/Gdmd0n3336/petsCR)` — уникально идентифицирует приложение, как просит политика.
- Отсюда (облачная среда Claude Code) Overpass недоступен — прокси отвечает 403. Реальный запрос делает только Макс; тесты сеть не используют.

### Решение 6. Кэш вне репозитория
По умолчанию каталог `~/lapa-osm-import/` (или `--out-dir`). Файлы: `overpass-TH-20-<YYYY-MM-DD>.json` (сырой ответ), `venues_import_upsert.sql`, `import-log-<YYYY-MM-DD>.txt` (копия журнала). Скрипт **отказывается** писать в каталог внутри репозитория (сравнение реальных путей с корнем репозитория) — так сырые данные не попадут в git. Повтор без сети: `--from-file <путь к json>`.

### Решение 7. Запуск TypeScript без новых зависимостей
`node --experimental-strip-types scripts/import-osm/main.ts` (Node 22, проверено в среде на 22.22). Только «стираемый» синтаксис TS (типы, без enum и parameter properties). Альтернатива `tsx` — лишняя зависимость. Проверка типов скриптов: отдельный `tsconfig.scripts.json` (types: node), добавляется в `references` корневого `tsconfig.json`, поэтому `npm run typecheck` и CI покрывают скрипт. В сборку приложения скрипт не попадает (Vite собирает только `src/`).

### Решение 8. Проверка идемпотентности на настоящем Postgres: PGlite (ВОПРОС МАКСУ)
`@electric-sql/pglite` 0.5.10 (Apache-2.0, ~35 МБ, только devDependency, в приложение не попадает): Postgres в WebAssembly внутри Vitest. Тест применяет **файл миграции из репозитория** и выполняет сгенерированный SQL дважды. Проверено прототипом в scratchpad.
Альтернативы: только проверка текста SQL (не доказывает, что SQL вообще выполняется); Docker с Postgres (в CI и у Макса может не быть Docker); ручная проверка Макса в SQL Editor (остаётся как финальная, но не автоматическая). Рекомендую PGlite.
Ограничение: в PGlite нет схемы `auth` Supabase и ролей `anon/authenticated/service_role` — тест создаёт эти роли сам перед миграцией. Миграция `venues_import` от `auth` не зависит.

### Источники сверки
| Что | Источник |
|---|---|
| Overpass QL: `out center tags`, `area`, `nwr`, `[out:json][timeout]` | Context7 `/websites/wiki_openstreetmap_wiki_overpass_api` (Overpass QL, Advanced examples, Language Guide) |
| Политика overpass-api.de, запасные серверы | OSM wiki «Overpass API», таблица Public instances (Context7, там же); WebSearch: dev.overpass-api.de/overpass-doc (10 000 запросов / 1 ГБ в сутки) |
| Ошибка «too busy» | OSM wiki «Overpass API/status» |
| ODbL: атрибуция, Derivative/Collective Database | osmfoundation.org «Licence and Legal FAQ», «Attribution» (WebSearch) |
| Node 22 type stripping, `fetch`, `AbortSignal.timeout` | проверено в среде (v22.22.0) |
| PGlite | `npm view @electric-sql/pglite`, прототип в scratchpad |

## Problems

| # | Problem | Solution | Status |
|---|---------|----------|--------|
| 1 | Overpass перегружен / недоступен | повтор с паузой 30 с, запасной сервер, кэш, `--from-file` | pending |
| 2 | Из облачной среды Overpass недоступен (403 прокси) | реальный запрос у Макса; тесты на файле-образце и подмене `fetch` | pending |
| 3 | SQL-инъекция через теги | одна JSON-строка + `jsonb_to_recordset`; тест со «злыми» тегами | pending |
| 4 | Перезапись решений человека | `status`, `imported_at` не в `do update`; тест на PGlite | pending |
| 5 | Сырые данные случайно попадут в git | запрет записи внутрь репозитория + тест | pending |
| 6 | ODbL share-alike для `venues` | вне TASK-03; поднять до TASK-04 (вопрос к Максу/юристу, «не проверено») | open |
| 7 | Объект без координат (relation без center) | пропуск с подсчётом в журнале | pending |
| 8 | Типы БД (`database.types.ts`) не знают `venues_import` | файл сгенерированный, руками не правим; Макс перегенерирует после применения миграции (скрипт типы БД не использует) | pending |

## Phases

### Phase 1: миграция `venues_import`
- **Files:** `supabase/migrations/20261019120000_venues_import.sql`
- **Changes:**
  ```
  venues_import(
    osm_type text not null check (osm_type in ('node','way','relation')),
    osm_id bigint not null,
    tags jsonb not null,
    lat double precision not null check (lat between -90 and 90),
    lng double precision not null check (lng between -180 and 180),
    category text not null check (category in ('vet_clinic','grooming','boarding','pet_shop')),
    status text not null default 'new' check (status in ('new','approved','rejected','duplicate')),
    imported_at timestamptz not null default now(),
    last_seen_at timestamptz not null default now(),   -- добавлено
    primary key (osm_type, osm_id)
  )
  ```
  RLS включён; `revoke all … from anon, authenticated`; `grant all … to service_role`; политик нет (как `venue_line_links`). `primary key (osm_type, osm_id)` = требуемый ключ уникальности и цель для `on conflict`.
- **TDD:** тест (Phase 3, PGlite) применяет миграцию; проверка, что роли `anon`/`authenticated` не могут `select`.
- **Gates:** lint ✅ | typecheck ✅ | test ✅ | build ✅
- **Impact:** новая таблица, существующие не меняются. Применяет Макс (контрольная точка 3 ТЗ), после — Security/Performance Advisors.

### Phase 2: разбор ответа и категории
- **Files:** `scripts/import-osm/parse.ts`, `scripts/import-osm/parse.test.ts`, `scripts/import-osm/fixtures/overpass-sample.json`, `tsconfig.scripts.json`, `tsconfig.json`
- **Changes:** `buildQuery()`, `categoryFor(tags)`, `parseOverpass(json) → { rows, skipped }`, `summarize(rows, skipped)` (по типам; по категориям: всего / с телефоном / с часами).
- **Файл-образец (~10 элементов, вручную, данные вымышленные):** node ветклиника с `phone` и `opening_hours`; way груминг с `center` и `contact:phone`; relation передержка с `center`; node зоомагазин без телефона; node с `amenity=veterinary` + `shop=pet` (приоритет); node с `shop=pet_grooming` + `shop=pet` (невозможная пара тегов — проверка устойчивости); relation без `center` (пропуск); node с «злыми» значениями тегов (`'`, `$$`, `;`, `--`, `\`, `\n`); повтор одного и того же элемента (дедупликация в ответе); объект с чужим тегом без нужных (`amenity=cafe`, отбрасывается).
- **TDD (сначала красные):** категории для каждого тега и приоритет; телефон = `phone` или `contact:phone`; часы = `opening_hours`; координаты node = `lat/lon`, way/relation = `center`; пропуск без координат; дедупликация; итоговые числа `summarize` для образца.
- **Gates:** lint ✅ | typecheck ✅ | test ✅ | build ✅
- **Impact:** новый `tsconfig.scripts.json` в `references` → `tsc -b` проверяет скрипты.

### Phase 3: генерация SQL и проверка идемпотентности
- **Files:** `scripts/import-osm/sql.ts`, `scripts/import-osm/sql.test.ts`, `package.json` (devDependency PGlite — если Макс одобрит)
- **Changes:** `buildUpsertSql(rows, meta)` → текст: комментарий-шапка (дата, источник, число строк), `begin;`, один `insert … select … from jsonb_to_recordset('<json>'::jsonb) … on conflict … do update …;`, `commit;`, итоговый `select category, count(*) from public.venues_import group by 1`.
- **TDD:** (1) в SQL ровно одно вхождение данных, значения не встречаются вне JSON-литерала; (2) PGlite: роли → миграция из репозитория → SQL → `count = N`; меняем `status` у строки на `approved`; SQL ещё раз → `count = N`, `status = approved`, `imported_at` не изменился, `last_seen_at` обновился; (3) «злые» теги сохранились байт в байт; (4) изменённые координаты в новом ответе обновились; (5) роль `anon` не читает таблицу.
- **Gates:** lint ✅ | typecheck ✅ | test ✅ | build ✅ | `npm audit --audit-level=high`
- **Impact:** время тестов вырастет (PGlite стартует ~1–2 с) — приемлемо.

### Phase 4: сеть, кэш, CLI и журнал
- **Files:** `scripts/import-osm/fetch.ts`, `scripts/import-osm/fetch.test.ts`, `scripts/import-osm/main.ts`, `scripts/import-osm/main.test.ts`, `package.json` (скрипт `import:osm`)
- **Changes:** `fetchOverpass(query, { servers, attemptsPerServer: 3, pauseMs: 30000, timeoutMs: 180000, fetchImpl, sleep, log })`; `main(argv)`: разбор флагов `--out-dir`, `--from-file`, `--server`; проверка «каталог вне репозитория»; сохранение сырого ответа до разбора; журнал в консоль и в файл.
- **TDD (подмена `fetch` и `sleep`, без сети):** 429 → пауза → 200; 3 × 504 → переход на запасной сервер; ответ 200 с `runtime error … too busy` = повтор; все провалились → понятная ошибка с перечнем попыток и код выхода 1; заголовок `User-Agent` есть; вызовы строго последовательные; `--from-file` не вызывает `fetch`; запись в каталог внутри репозитория отклонена; при сбое разбора сырой файл уже сохранён.
- **Gates:** lint ✅ | typecheck ✅ | test ✅ | build ✅
- **Impact:** нет потребителей в приложении.

### Phase 5: инструкция
- **Files:** `supabase/README.md` (раздел «Импорт из OpenStreetMap»)
- **Changes:** порядок: применить миграцию → `npm run import:osm` → прочитать журнал → выполнить `venues_import_upsert.sql` в SQL Editor → перегенерировать типы; как проверить идемпотентность руками (выполнить файл второй раз, число строк то же); где лежит кэш; лимиты Overpass; ODbL-атрибуция.
- **Gates:** lint ✅ (Prettier для md отключён в проекте) | все проверки проекта.

### После фаз (этапы 8–10)
- Этап 8: все проверки по проекту + `npm audit`; прогон скрипта у меня — только `--from-file` на файле-образце (сеть отсюда недоступна), вывод журнала — в отчёт.
- Этап 9: ревью свежим контекстом (`code-reviewer`).
- Этап 10: `/security-review` (особое внимание: SQL-генерация, пути файлов).
- Критерий «вывод лога показан Максу» закрывается в два шага: журнал на файле-образце — в моём отчёте; журнал реального запуска — после запуска у Макса.

## Как будет выглядеть журнал (пример на файле-образце, числа условные)
```
Lapa · импорт OSM · 2026-10-19 12:00:00
Источник: файл ~/lapa-osm-import/overpass-TH-20-2026-10-19.json  (или: https://overpass-api.de/api/interpreter, попытка 2 из 3)
Элементов в ответе: 10 (node 7, way 2, relation 1); дублей в ответе: 1; без координат: 1; без нужных тегов: 1
Категория      всего  с телефоном  с часами работы
vet_clinic         3            2                1
grooming           2            1                1
boarding           1            0                0
pet_shop           1            0                0
Итого к загрузке: 7
Сырой ответ: ~/lapa-osm-import/overpass-TH-20-2026-10-19.json
SQL для SQL Editor: ~/lapa-osm-import/venues_import_upsert.sql
Данные © участники OpenStreetMap, ODbL.
```

## Challenge Loop (итог)
1. **Решает ли задачу:** скрипт и запрос (Phase 2, 4), таблица (Phase 1), upsert без дублей и без затирания решений (Phase 3, PGlite), журнал (Phase 4), один ручной запуск с паузой и кэшем вне репозитория (Phase 4), тесты на образце (Phase 2–4), доступ без `service_role` (Решение 1). Все критерии спецификации покрыты.
2. **Лучшее ли решение:** альтернативы и причины — Решения 1, 2, 7, 8.
3. **Нет ли кода ради кода:** без ORM, без драйвера БД, без `tsx`, без регулярного запуска, без автоматического поиска дублей. Единственная новая зависимость (PGlite, dev) — только если Макс одобрит; без неё Phase 3 проверяет текст SQL, а идемпотентность подтверждает Макс вручную.

## Вопросы к Максу
1. **Доступ к базе (Решение 1):** вариант A — скрипт генерирует SQL-файл, вы выполняете его в SQL Editor (рекомендую: никаких ключей нигде) / B — отдельная роль Postgres с правами только на `venues_import` / C — `service_role` в локальном `.env.local` (не рекомендую).
2. **PGlite (Решение 8):** добавить `@electric-sql/pglite` как dev-зависимость для проверки идемпотентности на настоящем Postgres в тестах и CI (рекомендую) / не добавлять, проверять только текст SQL + ваша ручная проверка.
3. **ODbL (Problem 6, юридический риск, «не проверено»):** если `venues` будет заполняться из OSM и дополняться нашими правками, это, вероятно, Derivative Database с обязанностью share-alike при публичном использовании. На TASK-03 не влияет; предлагаю решить до TASK-04, нужно ли разделять OSM-поля и наши данные (цены, отзывы) или консультироваться с юристом.

## Changelog

| Date | Phase | Changes |
|------|-------|---------|
| 2026-10-19 | plan | первая версия плана |
