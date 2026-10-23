# Вендоренные скиллы Claude Code

Скиллы лежат в репозитории как обычные файлы проекта (без вложенного `.git`). Автообновления нет: обновление — только вручную, по процедуре внизу, с новой проверкой.
Не используются: `npx skills add`, маркетплейс плагинов, глобальная установка. Taste Skill и Hallmark не ставились.

| Скилл | Папка | Источник | Проверенный коммит | Дата проверки | Лицензия |
|---|---|---|---|---|---|
| ui-ux-pro-max | `.claude/skills/ui-ux-pro-max/` | github.com/nextlevelbuilder/ui-ux-pro-max-skill, папка `.claude/skills/ui-ux-pro-max` | `28327f2f214d31bbd7555ed0c012a5df6484ed96` (2026-10-23) | 2026-10-23 | MIT (`LICENSE`, Copyright (c) 2024 Next Level Builder) |
| impeccable | `.claude/skills/impeccable/` | github.com/pbakaus/impeccable, папка `.claude/skills/impeccable` (сборка для Claude Code), версия скилла 4.7.0, движок 0.1.16 | `5cb95eea9c96479f57afe0732a45470d30183326` (2026-10-23) | 2026-10-23 | Apache 2.0 (`LICENSE`, `NOTICE.md`) |

## Что скопировано

- **ui-ux-pro-max:** `SKILL.md`, `references/`, `data/` (CSV/JSON), `scripts/*.py`, `LICENSE` из корня репозитория. **Не скопировано:** `scripts/tests/` — тесты сопровождающих, ссылаются на скрипты обновления каталогов из корня их репозитория (в скилл не входят), для работы скилла не нужны. Остальное совпадает с исходником байт в байт (`diff -r`).
- **impeccable:** вся папка `.claude/skills/impeccable` без изменений, плюс `LICENSE` и `NOTICE.md` из корня репозитория (Apache 2.0 требует сохранять NOTICE). Каталога `scripts/bin/` с бинарником в исходнике нет.
- Эти папки исключены из ESLint, Prettier и проверки типов (`.claude` уже в исключениях); в сборку приложения не попадают.

## Что исполняется на машине

### ui-ux-pro-max
- `scripts/search.py` (+ `core.py`, `design_system.py`, `reasoning_contract.py`): только стандартная библиотека Python 3; читает локальные CSV из `data/`. Сети, `subprocess`, `eval/exec` нет.
- Запись файлов — только с флагом `--persist`: создаёт `design-system/<slug>/MASTER.md` и `pages/*.md` в `--output-dir` (или в текущей папке). Имена очищаются (`safe_slug`), существующий MASTER.md без `--force` не перезаписывается.
- `scripts/validate_data.py` — проверка данных для сопровождающих, сети нет.

### impeccable
- `SKILL.md` велит **в начале каждого сеанса** запускать `.claude/skills/impeccable/scripts/impeccable context`. Это shell-лаунчер (`scripts/impeccable`, для Windows `impeccable.cmd`), он запускает нативный бинарник движка. Порядок поиска: `$IMPECCABLE_BIN` → `scripts/bin/<os>-<arch>/` (в скилле отсутствует) → `~/.impeccable/bin/impeccable` → кеш `~/.impeccable/bin/0.1.16/` → `impeccable` в `PATH` → **скачивание** с `https://github.com/pbakaus/impeccable/releases/download/engine-v0.1.16/impeccable-<os>-<arch>` в `~/.impeccable/bin/0.1.16/` и запуск.
- Скачанный бинарник проверяется по `.sha256`, загруженному **с того же адреса** — это защита от повреждения, не от подмены. Исходник движка (Rust, `crates/`) в репозитории есть, но выложенный бинарник с ним никто из нас не сверял.
- Движок по командам скилла: читает и пишет `PRODUCT.md`, `DESIGN.md`, `.impeccable/` в проекте; `hooks on` прописывает хук в `.claude/settings.local.json` (автозапуск детектора после правок UI); `pin` создаёт команды-ярлыки; `live` вставляет скрипт в `index.html` и поднимает локальный сервер (`scripts/live-browser*.js` общаются только с `http://localhost`), `live-inject --remove` убирает вставку.
- `scripts/modern-screenshot.umd.js` — минифицированная сторонняя библиотека для скриншотов в браузере (без заголовка лицензии в файле).

## Что настораживает

1. **Impeccable скачивает и запускает непроверенный нативный бинарник** при первом же вызове скилла (шаг Setup). Нужна сеть к github.com и запись в `~/.impeccable`.
2. **Телеметрия Impeccable включена по умолчанию:** команды подбора направлений (`concept-seed`, `serve-question`) отправляют на `https://impeccable.style/api` (`/api/roll`, `/api/chosen`) выбор пользователя (идентификаторы карточек, тип выбора) и заголовок с версией клиента. Отключение: `DO_NOT_TRACK=1` или `IMPECCABLE_NO_TELEMETRY=1`, либо `impeccable telemetry off`.
3. **`generate-image`** (генерация макетов) обращается к `https://api.openai.com` с `OPENAI_API_KEY` из окружения, если ключ задан.
4. Тексты Impeccable написаны напористо («gives you the tools and permission…», «Finish the job. No hedging»). По приоритету документов (`CLAUDE.md` → `TZ-bulletproof` → …) правила проекта (минимальная сложность, остановки, подтверждения Макса) важнее.
5. ui-ux-pro-max в `SKILL.md` указывает путь через `${CLAUDE_PLUGIN_ROOT}`, который при установке в проект не задан — вызывать по пути от корня проекта (см. ниже).

В скилле Impeccable есть штатный запасной путь: если лаунчер не запущен или запрещён, скилл читает `PRODUCT.md`/`DESIGN.md` напрямую и продолжает работу по справочникам `reference/*.md`.

## Движок Impeccable отключён намеренно

Решение Макса (2026-10-23): движок (лаунчер `scripts/impeccable`, `impeccable.cmd` и бинарник) в проекте не запускается.

**Почему:** лаунчер при первом вызове скачивает и запускает непроверенный нативный бинарник; у движка по умолчанию включена телеметрия на `impeccable.style`; `generate-image` ходит в OpenAI; `hooks on` и `live` меняют `.claude/settings.local.json` и `index.html`.

**Как отключено:** `permissions.deny` в `.claude/settings.json`:
- `Bash(*impeccable/scripts/impeccable*)` — лаунчер (sh и .cmd), в том числе внутри `sh -c` и с переменными окружения впереди;
- `Bash(*.impeccable/bin/*)`, `Bash(impeccable)`, `Bash(impeccable *)`, `Bash(*IMPECCABLE_BIN*)` — бинарник из кеша, из `PATH` и через `IMPECCABLE_BIN`;
- `Bash(*impeccable* hooks on*)`, `Bash(*impeccable* live*)`, `Bash(*impeccable* generate-image*)` и `Skill(impeccable hooks on*)`, `Skill(impeccable live*)`, `Skill(impeccable generate*)` — команды, меняющие проект или идущие в сеть;
- `Write(/DESIGN.md)`, `Edit(/DESIGN.md)`, `Write(/PRODUCT.md)`, `Edit(/PRODUCT.md)` — корневые файлы не создаются, источник правды `design/` (см. `CLAUDE.md`).

**Что работает:** сам скилл (`/impeccable critique|audit|polish …`) виден и вызывается. По его штатному запасному пути («Launcher unavailable») он читает `design/PRODUCT.md` и `design/DESIGN.md` напрямую и работает по справочникам `reference/*.md`. Проверено 2026-10-23: вызов лаунчера отклонён, контекст прочитан из `design/`, `~/.impeccable` не создан.

**Ограничение:** правила Bash в Claude Code сравнивают текст команды; по документации это страховка, а не граница безопасности (вызов в другой форме может не совпасть). Побочный эффект: команды, в тексте которых встречаются эти шаблоны (например, сообщение коммита с «impeccable live»), тоже отклоняются — сообщения коммитов передавать через файл (`git commit -F`).

## Как вызывать

- **ui-ux-pro-max:** Claude Code подхватывает скилл сам по описанию задачи (дизайн, ревью UI) или по просьбе «используй ui-ux-pro-max». Поиск по базе вручную, из корня проекта:
  ```bash
  python3 .claude/skills/ui-ux-pro-max/scripts/search.py "pet clinic catalog mobile" --domain ux -n 3
  python3 .claude/skills/ui-ux-pro-max/scripts/search.py "veterinary booking app" --design-system -p "Lapa"
  python3 .claude/skills/ui-ux-pro-max/scripts/search.py "list virtualization" --stack react
  ```
- **impeccable:** команда `/impeccable <команда> [цель]`, например `/impeccable audit src/screens/CatalogScreen.tsx`, `/impeccable critique src/screens/VenueScreen.tsx`, `/impeccable polish src/components/VenueCard.tsx`; без аргумента — меню. Движок отключён (см. выше): скилл работает по справочникам и `design/`.

## Обновление (только вручную)

1. Склонировать репозиторий во временную папку, взять конкретный коммит.
2. Прочитать изменения в `SKILL.md`, справочниках и всех скриптах (`git diff <старый>..<новый> -- <папка скилла>`), особенно сеть, запись файлов, запуск процессов.
3. Скопировать папку без `.git`, обновить таблицу выше (коммит, дата), прогнать проверки проекта, отдельный PR.
