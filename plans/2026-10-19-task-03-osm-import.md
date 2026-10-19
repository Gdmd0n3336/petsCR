# Plan: TASK-03 импорт заведений из OpenStreetMap
**Spec:** specs/2026-10-19-task-03-osm-import.md
**Research:** thoughts/research/2026-10-19-task-03-osm-import.md
**Status:** in_progress (фазы 1–5 и этапы 8–10 пройдены; ждёт решения Макса по находке ревью №2 и версии миграции)
**Branch:** `feature/task-03-osm-import`. PR — только по команде Макса.

## Как это работает
Макс выгружает данные в Overpass Turbo (запрос `out center tags`, экспорт «raw OSM data» в JSON) и сохраняет файл у себя. Затем `npm run import:osm -- --from-file <файл>`: скрипт проверяет формат, разбирает элементы, печатает журнал и пишет `venues_import_upsert.sql` в каталог вне репозитория. Помощник Макса выполняет SQL через свой доступ. Скрипт в сеть не ходит и к базе не подключается.

## Решения Макса (2026-10-19)
1. Доступ к базе — вариант A: только генерация SQL-файла.
2. Сетевой части нет (Overpass, повторы, запасной сервер, паузы удалены из плана). Только `--from-file`. Не тот формат (GeoJSON и др.) → понятная ошибка по-русски.
3. PGlite — dev-зависимость с точной версией; тестируется только миграция `venues_import`; время CI — в отчёте.
4. ODbL на задачу не влияет; в данных сохраняются `osm_type`, `osm_id`, `source`.
5. Миграция файлом по образцу; Макс применит и сообщит версию, затем файл переименовывается.

## Challenge Log

### Решение 1. Доступ к базе: SQL-файл (вариант A)
Варианты B (отдельная роль Postgres), C (`service_role` локально), D (Edge Function) — см. версию плана от 2026-10-19 в истории git; выбран A решением Макса: ключей нет нигде, тот же путь, что у миграций.

### Решение 2. Безопасная передача данных в SQL
Массив записей — одной JSON-строкой в SQL-литерале (экранирование только `'` → `''`), разбор через `jsonb_to_recordset`. Значения тегов никогда не склеиваются в SQL. Альтернативы (dollar-quoting, построчные `values`) отклонены как более хрупкие.

### Решение 3. Идемпотентность и сохранение решений
`insert … on conflict (osm_type, osm_id) do update set tags, lat, lng, category, osm_timestamp, last_seen_at = now()`. Не обновляются `status`, `imported_at`, `source`. Исчезнувшие из OSM объекты не удаляются.

### Решение 4. Приоритет категорий
`amenity=veterinary` → `vet_clinic` > `amenity=animal_boarding` → `boarding` > `shop=pet_grooming` → `grooming` > `shop=pet` → `pet_shop`.

### Решение 5. Проверка формата файла
Ожидается JSON Overpass: объект с массивом `elements`, элементы `{ type: node|way|relation, id: integer, tags, lat/lon | center }`. Понятные ошибки по-русски для: файл не найден; не JSON (в том числе XML: начинается с `<`); GeoJSON (`type: "FeatureCollection"` или `features`); нет `elements`; элемент с неверным `type`/`id`. Элементы без координат (запрос без `out center`) и без нужных тегов не ошибка, а пропуск со счётчиком в журнале.

### Решение 6. Колонки `source` и `osm_timestamp` (добавлено, решение Макса 4)
`source text not null default 'osm'` (check `= 'osm'`, чтобы позже можно было расширить осознанно) и `osm_timestamp timestamptz` — время данных OSM из `osm3s.timestamp_osm_base` файла (для атрибуции ODbL и понимания свежести).

### Решение 7. Запуск TS без зависимостей
`node --experimental-strip-types scripts/import-osm/main.ts`. Только стираемый синтаксис TS. Проверка типов — `tsconfig.scripts.json` в `references` корневого `tsconfig.json`.

### Решение 8. PGlite
`@electric-sql/pglite` **0.5.10** (точная версия, devDependency). Тест создаёт роли `anon`, `authenticated`, `service_role`, применяет только `supabase/migrations/*_venues_import.sql` и выполняет сгенерированный SQL.

### Источники сверки
| Что | Источник |
|---|---|
| Формат JSON Overpass (`version`, `osm3s`, `elements`, `center` для way/relation) | файл Макса `export.json` (Overpass API 0.7.62.11), OSM wiki «Overpass QL» (Context7) |
| ODbL | osmfoundation.org «Licence and Legal FAQ», «Attribution» |
| PGlite | `npm view @electric-sql/pglite`, прототип |
| Node 22 type stripping | проверено в среде, v22.22.0 |

## Problems
| # | Problem | Solution | Status |
|---|---------|----------|--------|
| 1 | Не тот формат файла | Решение 5, тесты на каждый случай | pending |
| 2 | SQL-инъекция через теги | Решение 2, тест со «злыми» тегами | pending |
| 3 | Перезапись решений человека | Решение 3, тест на PGlite | pending |
| 4 | SQL с данными попадёт в git | запрет записи внутрь репозитория (тест), выход в `~/lapa-osm-import/` | pending |
| 5 | `database.types.ts` не знает `venues_import` | файл сгенерированный, перегенерирует Макс после применения миграции | pending |
| 6 | В OSM часть передержек отмечена `shop=pet` | не исправляем автоматически; категорию поправит человек в TASK-04 (наблюдение в отчёте) | open |

## Phases

### Phase 1: миграция
- **Files:** `supabase/migrations/20261019120000_venues_import.sql` (версию переименуем после применения Максом)
- **Changes:** таблица `venues_import` (osm_type, osm_id, tags, lat, lng, category, status, source, osm_timestamp, imported_at, last_seen_at; `primary key (osm_type, osm_id)`; check-ограничения), RLS, `revoke` у `anon`/`authenticated`, `grant all` `service_role`.

### Phase 2: разбор и категории
- **Files:** `scripts/import-osm/parse.ts`, `parse.test.ts`, `fixtures/overpass-sample.json`, `fixtures/geojson-sample.json`, `tsconfig.scripts.json`, `tsconfig.json`
- **TDD:** категории и приоритет; телефон (`phone`, `contact:phone`); часы (`opening_hours`); координаты node/way/relation; пропуски; дубли; без названия; ошибки формата.

### Phase 3: SQL и PGlite
- **Files:** `scripts/import-osm/sql.ts`, `sql.test.ts`, `package.json` (PGlite 0.5.10)
- **TDD:** одна JSON-вставка; PGlite: миграция → SQL → N строк; `status = approved`; SQL ещё раз → N строк, статус и `imported_at` прежние, координаты обновились; «злые» теги байт в байт; `anon` не читает таблицу.

### Phase 4: CLI и журнал
- **Files:** `scripts/import-osm/main.ts`, `main.test.ts`, `package.json` (`import:osm`)
- **TDD:** без `--from-file` → ошибка; запись внутрь репозитория запрещена; файлы создаются в `--out-dir`; журнал с числами; ошибки формата → код 1 и текст по-русски.

### Phase 5: инструкция
- **Files:** `supabase/README.md` (раздел «Импорт из OpenStreetMap»)

### Этапы 8–10
Проверки проекта и `npm audit`; прогон на файле Макса (журнал в отчёт, SQL — только в scratchpad); ревью свежим контекстом; `/security-review`; время CI.

## Changelog
| Date | Phase | Changes |
|------|-------|---------|
| 2026-10-19 | plan | первая версия плана |
| 2026-10-19 | plan v2 | решения Макса: вариант A, без сети (только `--from-file`), PGlite 0.5.10, `source`/`osm_timestamp` |
| 2026-10-19 | 1–5 | миграция (8fe3cee), разбор (8fe3cee), SQL + PGlite (f24bad0, 695f880), CLI (a57014b), README (496f27e) |
| 2026-10-19 | 8–10 | проверки, реальный файл Макса (51 объект), ревью свежим контекстом, /security-review — уязвимостей нет; правки доказанных ошибок ревью (872c956): remark, суррогаты, timestamp, set local; CI 23 с (npm test 6 с) |
