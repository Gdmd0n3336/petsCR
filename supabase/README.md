# supabase/

Схема базы проекта Supabase `lapa` (ref `fyvsfeiplqqaliqichye`, регион ap-southeast-1).

```
supabase/
├── migrations/   # SQL-миграции, по одной на изменение схемы
└── tests/
    └── rls_smoke.sql   # ручная проверка политик доступа (RLS)
```

Сгенерированные типы TypeScript лежат в `src/types/database.types.ts` и подключены в `src/lib/supabase.ts` (`createClient<Database>`).

## Как применяются миграции

1. Новая миграция сначала появляется файлом в `supabase/migrations/` с именем `<YYYYMMDDHHMMSS>_<название>.sql`.
2. Применяет её к базе Макс через свой доступ к проекту Supabase. У разработки (в том числе у Claude Code) ключей и доступа к базе нет; применение на проде только после подтверждения Макса.
3. Уже применённые файлы не редактируются. Любое изменение схемы — новая миграция.
4. После применения: проверка Security и Performance Advisors в панели Supabase без критичных замечаний, затем перегенерация типов (`npx supabase gen types typescript --project-id fyvsfeiplqqaliqichye --schema public > src/types/database.types.ts`, нужен `npx supabase login`) и коммит.

`20261008134840_lapa_initial_schema.sql` уже применена к проекту (TASK-02). Повторно её не запускать: `create table` упадёт на существующих таблицах.

## Как запустить `tests/rls_smoke.sql`

1. Откройте проект в панели Supabase → **SQL Editor** → New query.
2. Вставьте содержимое `supabase/tests/rls_smoke.sql` целиком и нажмите **Run**.

Скрипт создаёт двух тестовых пользователей, заведения, заявки и сообщения, затем проверяет, что видят и что могут сделать роли `authenticated` (пользователи A и B) и `anon`. В конце он **намеренно завершается ошибкой**, поэтому все тестовые данные откатываются и в базе ничего не остаётся.

### Ожидаемый результат

Запрос завершается ошибкой (это нормально) с таким текстом:

```
RLS_TEST_RESULT a_sees_own_requests=1 a_sees_b_requests=0 a_messages=1 a_venues=1 b_sees_requests=1 anon_venues=1 anon_hidden=0 | insert_for_other_user=blocked forged_status=blocked hidden_venue=blocked update_status=blocked read_line_links=blocked anon_requests=blocked
```

| Значение | Что проверяет |
|---|---|
| `a_sees_own_requests=1` | пользователь A видит свою заявку |
| `a_sees_b_requests=0` | A не видит заявку пользователя B |
| `a_messages=1` | A видит только сообщения своей заявки |
| `a_venues=1` | видно только опубликованное заведение |
| `b_sees_requests=1` | B видит только свою заявку |
| `anon_venues=1`, `anon_hidden=0` | аноним видит опубликованное и не видит скрытое заведение |
| `insert_for_other_user=blocked` | нельзя создать заявку от чужого имени |
| `forged_status=blocked` | нельзя создать заявку со статусом, отличным от `sent` |
| `hidden_venue=blocked` | нельзя создать заявку в неопубликованное заведение |
| `update_status=blocked` | клиент не может менять статус заявки |
| `read_line_links=blocked` | LINE-идентификаторы клиник закрыты для клиента |
| `anon_requests=blocked` | аноним не читает заявки |

Если хотя бы одно значение отличается (например, `ALLOWED` или другое число), политики доступа нарушены: не применяйте новые миграции и разберите причину.

## Импорт заведений из OpenStreetMap (TASK-03)

Скрипт `scripts/import-osm` превращает экспорт Overpass Turbo в SQL для таблицы `public.venues_import` (миграция `*_venues_import.sql`). В сеть он не ходит и к базе не подключается — ключи не нужны.

1. **Миграция.** Применить `supabase/migrations/*_venues_import.sql` (один раз), затем проверить Advisors и перегенерировать типы.
2. **Экспорт.** В [Overpass Turbo](https://overpass-turbo.eu/) выполнить запрос и сохранить «Экспорт» → «необработанные данные OSM» (raw OSM data, JSON). GeoJSON и XML не подходят — скрипт остановится с ошибкой.
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
   Один запрос вручную, без повторов подряд: публичный сервер Overpass перегружен и просит не злоупотреблять.
3. **Скрипт** (Node 22):
   ```
   npm run import:osm -- --from-file ~/Downloads/export.json
   ```
   По умолчанию результат пишется в `~/lapa-osm-import/` (`--out-dir` — другой каталог; внутрь репозитория скрипт писать отказывается). Получится `venues_import_upsert.sql` и `import-log-<дата>.txt`; журнал также печатается в консоль: число объектов по категориям, сколько с телефоном, с часами работы, без названия, пропуски и дубли.
4. **SQL.** Открыть `venues_import_upsert.sql` в SQL Editor и выполнить целиком. В конце запрос покажет число строк по категориям.
5. **Повторный импорт** безопасен: новые объекты добавятся, у существующих обновятся теги и координаты, а `status` (решение проверяющего), `imported_at` и `source` не изменятся. Проверка вручную: выполнить тот же файл второй раз — число строк не меняется.

Категория выбирается по приоритету: `amenity=veterinary` → `vet_clinic`, затем `amenity=animal_boarding` → `boarding`, `shop=pet_grooming` → `grooming`, `shop=pet` → `pet_shop`. Объекты с несколькими тегами получают одну категорию; исходные теги сохраняются в `tags`, категорию можно поправить при проверке (TASK-04).

Данные © участники OpenStreetMap, лицензия ODbL. В каждой строке сохраняются `osm_type`, `osm_id`, `source = 'osm'` и время данных OSM (`osm_timestamp`).
