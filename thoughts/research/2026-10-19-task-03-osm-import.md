# Research: TASK-03 импорт заведений из OpenStreetMap
**Date:** 2026-10-19
**Task size:** M

## Current Architecture
- `main` после TASK-01/02: React + Vite приложение, Vitest (jsdom), ESLint 10 (`**/*.{ts,tsx}`), Prettier, CI (lint, typecheck, test, build).
- `tsconfig.app.json` включает только `src/`; `tsconfig.node.json` — только `vite.config.ts`. Папки `scripts/` нет.
- Схема БД: `supabase/migrations/20261008134840_lapa_initial_schema.sql` (применена). Образец закрытой таблицы — `venue_line_links`: RLS включён, политик и грантов для `anon`/`authenticated` нет, `grant all ... to service_role`. Категории в `venues.category`: `vet_clinic | grooming | boarding | pet_shop`.
- Миграции применяет Макс через свой доступ; у разработки нет ключей и доступа к базе (`supabase/README.md`).

## Affected Areas

| # | File/Module | Why affected |
|---|-------------|-------------|
| 1 | `supabase/migrations/<ts>_venues_import.sql` | новая таблица `venues_import` + RLS |
| 2 | `scripts/import-osm/*.ts` | запрос Overpass, разбор, лог, генерация SQL |
| 3 | `scripts/import-osm/fixtures/*.json` | файл-образец ответа Overpass для тестов |
| 4 | `scripts/import-osm/*.test.ts` | тесты разбора тегов, категорий, SQL, идемпотентности |
| 5 | `tsconfig.scripts.json`, `tsconfig.json`, `package.json` | проверка типов и запуск скрипта |
| 6 | `src/types/database.types.ts` | перегенерация после применения миграции (Макс) |
| 7 | `supabase/README.md` | как запустить импорт |

## Codebase Patterns
- TS strict, ESM (`"type": "module"`), `verbatimModuleSyntax`, `allowImportingTsExtensions`.
- Тесты рядом с кодом (`*.test.ts`), Vitest, `vi.stubEnv`, `vi.resetModules`.
- Миграции: `snake_case`, явные `revoke`/`grant`, RLS на всех таблицах, комментарии на английском в SQL.

## Факты, проверенные в этом исследовании
1. **Overpass QL** (Context7, OSM wiki «Overpass QL», «Advanced examples», «Language Guide»):
   - `out center` добавляет к way/relation центр bbox (центр может лежать вне полигона); `out tags` — только id и теги; модификаторы комбинируются: `out center tags;`.
   - область по тегу: `area["ISO3166-2"="TH-20"]->.p;` затем `nwr[...](area.p);`; `nwr` объединяет node/way/relation; глобальные настройки `[out:json][timeout:N]`.
2. **Политика основного сервера** `https://overpass-api.de/api/interpreter` (OSM wiki «Overpass API», таблица Public instances): разовое использование — до 10 000 запросов и 1 ГБ в сутки нормально; обязательно `User-Agent` или `Referer`, уникально идентифицирующий приложение; никаких параллельных скриптов; при HTTP 429 или 406 пауза 30 секунд; коммерческое регулярное использование — свой или платный сервер; сервер перегружен, высокой надёжности не ждать. Ошибка перегрузки приходит и как runtime error «The server is probably too busy» (страница «Overpass API/status»).
3. **Альтернативные бесплатные серверы** (там же): `https://overpass.private.coffee/api/interpreter` (бывший kumi.systems, без лимитов, просят предупреждать о крупных проектах), `https://maps.mail.ru/osm/tools/overpass/api/interpreter` (VK, без лимитов).
4. **Доступ из облачной среды Claude Code:** `curl https://overpass-api.de/api/status` → `CONNECT tunnel failed, response 403` (прокси среды). Значит, реальный запрос к Overpass отсюда невозможен: скрипт запускает Макс у себя, а тесты работают только на файле-образце.
5. **Node 22:** `node file.ts` выполняет TypeScript без сборки (type stripping, проверено на v22.22.0 в среде). Нижняя граница проекта `engines >=22.13`; без флага type stripping включён начиная с 22.18 (не проверено по changelog), поэтому для совместимости запускать с `--experimental-strip-types` (флаг принимается и в новых 22.x). Глобальные `fetch` и `AbortSignal.timeout` доступны.
6. **Лицензия ODbL** (osmfoundation.org «Licence and Legal FAQ», «Attribution» guideline 2021-06-25): для публичного использования нужна атрибуция («© участники OpenStreetMap»); база, которая адаптирует/дополняет/исправляет данные OSM, — Derivative Database (share-alike); набор независимых баз рядом с OSM — Collective Database. См. риск 5.

## Risks and Constraints
1. **Overpass недоступен/перегружен** → повтор с паузой (30 с при 429/406 по политике, также 5xx, таймаут, «too busy»), не более N попыток, затем последовательный (не параллельный) переход на запасной сервер. Ответ сохраняется в файл вне репозитория, повторные прогоны читают файл (`--from-file`), а не сервер.
2. **Ключ `service_role`.** Нельзя в репозитории и в клиентском коде. Варианты доступа к базе — в плане; рекомендация: скрипт не подключается к базе вообще, а генерирует SQL-файл с upsert, который Макс выполняет в SQL Editor (тем же путём, что и миграции). Ноль секретов.
3. **SQL-инъекция через теги OSM.** Теги — недоверенные внешние данные (`CLAUDE.md`, правило 10). Нельзя склеивать значения в SQL. Решение: одна JSON-строка внутри SQL-литерала (экранирование только `'` → `''`) и разбор на стороне Postgres через `jsonb_to_recordset`; тест с кавычками, `$$`, `;`, обратными слэшами и `--` в тегах.
4. **Идемпотентность и решения.** `on conflict (osm_type, osm_id) do update` обновляет только данные OSM (tags, lat, lng, category, last_seen), но **не** `status` и не `imported_at` (дата первого импорта). Объект с несколькими тегами (ветклиника + зоомагазин) получает одну категорию по приоритету.
5. **ODbL (юридический риск, «не проверено» юристом).** Если `venues` будет строиться из данных OSM и дополняться (телефоны, исправленные координаты), это вероятно Derivative Database с обязанностью share-alike при публичном использовании. Для TASK-03 риск не блокирующий (`venues_import` — сырая выгрузка), но решение нужно до TASK-04/TASK-06; предлагаю держать OSM-поля отделимыми от наших данных (цены, отзывы).
6. Размер: по Чонбури ожидается порядка сотен объектов (Макс проверял в Overpass Turbo, точное число не проверено) → один запрос, SQL-файл в десятки–сотни КБ, SQL Editor справляется.
7. Центр way/relation может лежать вне здания — для заведений приемлемо, координаты всё равно проверяются вручную в TASK-04.

## Open Questions
1. Как Макс получит доступ к базе для импорта (вариант A/B/C в плане) — решение Макса.
2. Нужен ли запасной сервер Overpass (VK / private.coffee) или только основной — рекомендация: основной + один запасной, последовательно.
3. Что делать с объектом, исчезнувшим из OSM при повторном импорте — рекомендация: не удалять, обновлять `last_seen_at`, решать в TASK-04.

## Best Practices Found
- OSM wiki: User-Agent, без параллельных запросов, пауза 30 с при 429/406, кэширование ответов.
- Upsert по естественному ключу `(osm_type, osm_id)` — стандартный способ идемпотентного импорта OSM.
- Передача массива записей одной JSON-строкой и `jsonb_to_recordset` — безопасная альтернатива склейке значений в SQL.

## Conclusion & Recommendation
**Recommended approach:** Node-скрипт на TypeScript без новых зависимостей (`fetch` Node 22): (1) один запрос Overpass с повтором и паузой, сохранение сырого JSON в файл вне репозитория; (2) чистые функции разбора и сопоставления категорий; (3) лог по категориям (всего, с телефоном, с часами работы); (4) генерация SQL-файла с upsert в `venues_import` через `jsonb_to_recordset`, который Макс выполняет в SQL Editor. Таблица `venues_import` создаётся миграцией по образцу `venue_line_links` (RLS, только `service_role`).
**Key reasons:**
1. Нет секретов вообще: скрипт не знает ключей, не подключается к базе; применение данных идёт тем же контролируемым путём, что и миграции.
2. Тестируемость: вся логика — чистые функции на файле-образце; сеть только в тонкой обёртке, которую можно проверить подменой `fetch`.
3. Ноль новых зависимостей и соответствие политике Overpass (один запрос, User-Agent, пауза, кэш).
**Risks of this approach:** ручной шаг (Макс вставляет SQL-файл в SQL Editor); при очень большом файле редактор может не принять — тогда разбивать на части (для сотен записей не нужно).
