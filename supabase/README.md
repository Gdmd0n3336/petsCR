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
