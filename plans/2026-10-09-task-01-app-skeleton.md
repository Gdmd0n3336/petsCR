# Plan: TASK-01 каркас приложения
**Spec:** specs/2026-10-09-task-01-app-skeleton.md
**Research:** thoughts/research/2026-10-08-task-01-app-skeleton.md
**Status:** planning
**Branch:** `feature/task-01-app-skeleton` (пробный push 2026-10-09 прошёл: облако не ограничивает push веткой `claude/*`, работаем в ветке по ТЗ). Предыдущая ветка `claude/clever-ride-he3q3z` содержит TASK-00 и исследование; новая ветка создана от неё. PR не создаём до завершения задачи и ревью Макса.

## Challenge Log

### Решение 1. Сборщик: Vite 8
**Problem:** нужен сборщик SPA для Mini App + обычного браузера.
**Chosen:** Vite 8 + `@vitejs/plugin-react` 6.
**Alternatives:**
1. Next.js — даёт SSR/SEO, но ТЗ откладывает SEO-страницы; лишний сервер и сложность для Mini App. Отклонён.
2. Rsbuild/Rspack — быстрый, но меньше примеров с Telegram Mini Apps и Vitest. Отклонён.
**Why (2 строки для отчёта):** Vite — стандарт для SPA без серверного рендера, сборка даёт статический `dist/`, который подходит для Mini App. Vitest использует тот же конфиг, второго транспайлера нет.

### Решение 2. TypeScript закреплён на `~6.0.x`
**Problem:** последняя версия TypeScript на npm 7.0.2.
**Chosen:** `typescript ~6.0.3`.
**Причина:** `typescript-eslint@8.71.1` требует `typescript >=4.8.4 <6.1.0` (`npm view`, 2026-10-08). С TS 7 линтер на типах не запустится. Шаблон `create-vite` react-ts тоже ставит `~6.0.2`.
**Условие пересмотра:** когда вышедшая версия `typescript-eslint` объявит в `peerDependencies` поддержку TS ≥ 6.1 / 7.x, обновляем отдельной задачей (S) и прогоняем все проверки.
**Alternatives:** TS 7 без линтера на типах (теряем правила typescript-eslint) — отклонён; oxlint вместо ESLint — отклонён Максом 2026-10-09.

### Решение 3. Линтер ESLint 10 (flat config) + typescript-eslint + react-hooks + react-refresh; форматтер Prettier
**Alternatives:** oxlint (быстрее, но меньше правил под хуки и типы), Biome (линт+формат в одном, но слабее правила React-хуков). Выбор ESLint подтверждён Максом.
Конфликт стилей линтера и форматтера исключаем: ESLint без стилевых правил, форматирование только Prettier (`format:check` входит в `lint`).

### Решение 4. Telegram: `@telegram-apps/sdk` 3.11.x через одну обёртку `src/lib/telegram.ts`
**Problem:** в браузере вне Telegram вызовы SDK бросают исключения.
**Chosen:** синхронная `isTMA()` из `@telegram-apps/sdk` (проверено по установленным типам: `@telegram-apps/sdk@3.11.8` реэкспортирует `isTMA` из `@telegram-apps/bridge@2.11.0`, `dist/dts/env/isTMA.d.ts`: «Returns true if the current environment is Telegram Mini Apps», по наличию launch params). Если `isTMA()` = true → `init()`, затем `miniApp.ready.ifAvailable()`; иначе ничего не вызываем. Весь вызов в `try/catch`: ошибка SDK не роняет приложение, а переводит в режим «браузер».
Для теста внутри Telegram используем `mockTelegramEnv` из того же пакета.
**Alternatives:**
1. `@telegram-apps/sdk-react` — добавляет хуки и провайдеры, в каркасе не нужны (минимальная сложность). Можно добавить позже без переписывания обёртки. Отклонён.
2. Официальный скрипт `telegram-web-app.js` с telegram.org + `window.Telegram.WebApp` — внешняя загрузка скрипта на каждом открытии, нет типов, сложнее тестировать. Остаётся запасным вариантом (принят Максом): `Boolean(window.Telegram?.WebApp?.initData)`.
3. `@twa-dev/sdk` — обёртка над тем же скриптом, менее активна. Отклонён.

### Решение 5. Supabase: `@supabase/supabase-js` 2.x, ленивое создание клиента
**Chosen:** `getSupabase()` создаёт клиент при первом вызове из `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`; если переменных нет, бросает понятную ошибку `SupabaseConfigError` (тест). Импорт модуля ничего не создаёт, поэтому без `.env` приложение открывается.
**Alternatives:** создание клиента при импорте (как в README supabase-js) — белый экран без `.env`, отклонён. Generic `Database` подключим в TASK-02-sync, когда появятся сгенерированные типы.

### Решение 6. Навигация без роутера
Активная вкладка = `useState` в `App`. Роутер в TASK-06 (решение Макса).

### Решение 7. Шрифты: `@fontsource-variable/manrope` и `@fontsource-variable/onest` (self-hosted)
**Alternatives:** Google Fonts по ссылке (запрос к стороннему домену на каждом открытии, хуже в слабой сети); системные шрифты (дизайн расходится с прототипом). Выбрано self-hosted через npm: шрифты попадают в `dist/`, нет внешних запросов. Noto Sans Thai не подключаем до появления тайского текста. **Вопрос к Максу ниже.**

### Решение 8. Тесты: Vitest 5 + jsdom + Testing Library
Конфиг `test` в `vite.config.ts` (`/// <reference types="vitest/config" />`), `setupFiles` с `@testing-library/jest-dom/vitest`.
**Alternatives:** happy-dom (быстрее, но менее совместим), Jest (второй транспайлер, отдельная настройка ESM/TS). Отклонены.

### Решение 9. Node 22: `.nvmrc` + `engines` + CI
`.nvmrc` = `22`; `"engines": { "node": ">=22.13" }` (нижняя граница из `eslint@10` `^22.13`, Vitest 5 `^22.12`, Vite 8 `>=22.12`). CI: `actions/setup-node@v7` c `node-version-file: .nvmrc` и `cache: npm`.

### Решение 10. Проверка циклических зависимостей (уровень 2)
`madge@8.0.0` объявляет необязательный peer `typescript ^5.4.4`, у нас TS 6. В Phase 1 проверяем установку: если `npm install -D madge` проходит без конфликта, добавляем скрипт `check:cycles`; если нет — уровень 2 по циклам помечаем «не выполнено: инструмент не поддерживает TS 6», без обходов через `--force`.

### Источники сверки версий (2026-10-08/09)
| Пакет | Версия | Источник |
|---|---|---|
| vite | 8.x (latest 8.3.4) | Context7 `/vitejs/vite/v8.0.10` (env, `vite/client`, Node 20.19+/22.12+), `npm view` |
| @vitejs/plugin-react | 6.1.x | `npm view` peer `vite ^8` |
| react, react-dom, @types/react(-dom) | 19.3.0 | `npm view`; Context7 шаблон `create-vite` react-ts (react ^19.2) |
| typescript | ~6.0.3 | `npm view` (latest 7.0.2), peer `typescript-eslint` `<6.1.0`, шаблон `create-vite` `~6.0.2` |
| vitest | 5.0.x | Context7 `/vitest-dev/vitest/v5.0.3` (environment, setupFiles, jest-dom), `npm view` engines Node `^22.12` |
| jsdom | 30.x | `npm view` |
| @testing-library/react / dom / jest-dom / user-event | 16.3.x / 10.4.x / 7.0.x / 14.6.x | `npm view`; jest-dom: Context7 Vitest example `@testing-library/jest-dom/vitest` |
| eslint, @eslint/js | 10.12.x / 10.0.x | `npm view` engines Node `^22.13` |
| typescript-eslint | 8.71.x | `npm view` peers |
| eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals | 7.1.x / 0.5.x / 17.x | `npm view` |
| prettier | 3.9.x | `npm view` |
| @supabase/supabase-js | 2.117.x | Context7 `/supabase/supabase-js` (createClient, publishable key), `npm view` |
| @telegram-apps/sdk | 3.11.8 | Context7 `telegram-apps-sdk/3-x` (init, isAvailable/ifAvailable, miniApp.ready), типы пакета (`isTMA`, `mockTelegramEnv`) |
| @fontsource-variable/manrope, onest | 5.3.x | `npm view` |
| actions/checkout, actions/setup-node | v7 (7.0.1 / 7.1.0) | страницы GitHub Releases |
Точные версии фиксирует `package-lock.json` в Phase 1; при установке повторно сверяем peer-предупреждения.

## Problems

| # | Problem | Solution | Status |
|---|---------|----------|--------|
| 1 | TS 7 ломает typescript-eslint | `~6.0.3`, условие пересмотра в Решении 2 | pending |
| 2 | Вне Telegram SDK бросает | `isTMA()` + try/catch, тест вне/внутри Telegram | pending |
| 3 | Без `.env` белый экран | ленивый `getSupabase()` | pending |
| 4 | Секреты в репозитории | `.env*` в `.gitignore`, `.env.example` пустой, хук секретов, проверка `git grep` перед коммитом | pending |
| 5 | madge vs TS 6 | Решение 10 | pending |
| 6 | Telegram задаёт свою тему и высоту окна | в каркасе используем свои токены, `min-height: 100dvh`, safe-area-inset снизу для меню; тема Telegram — отдельная задача | pending |
| 7 | `npm audit` может найти high в транзитивных dev-зависимостях | показать вывод; чинить только обновлением прямой зависимости; если фикса нет — сообщить Максу, не `--force` | pending |

## Phases

### Phase 1: инструменты
- **Status:** pending
- **Files:** `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/test/setup.ts`, `src/smoke.test.ts`
- **Changes:** зависимости из таблицы; скрипты `dev`, `build` (`tsc -b && vite build`), `typecheck` (`tsc -b --noEmit` или `tsc --noEmit -p tsconfig.app.json`), `lint` (`eslint . && prettier --check .`), `format`, `test` (`vitest run`), `preview`.
- **TDD:** smoke-тест (`expect(true)`), чтобы проверить, что раннер и jsdom работают.
- **Gates:** lint ✅ | typecheck ✅ | test ✅ | build ✅
- **Impact:** нет существующего кода; проверить, что Prettier не переформатирует документы проекта (`*.md` вне `src` в `.prettierignore`, чтобы не трогать `CLAUDE.md`, `TASKS.md`, скилл).

### Phase 2: Telegram и Supabase
- **Status:** pending
- **Files:** `src/lib/telegram.ts`, `src/lib/telegram.test.ts`, `src/lib/supabase.ts`, `src/lib/supabase.test.ts`, `.env.example`, `src/vite-env.d.ts`
- **Changes:** `initTelegram(): { inTelegram: boolean }` (без исключений); `getSupabase()` с `SupabaseConfigError`.
- **TDD (сначала красные):**
  1. вне Telegram (чистый jsdom) `initTelegram()` возвращает `inTelegram: false` и не бросает;
  2. с `mockTelegramEnv` возвращает `inTelegram: true` и не бросает;
  3. если SDK бросает внутри `init`, `initTelegram()` возвращает `false` и не бросает;
  4. `getSupabase()` без переменных бросает `SupabaseConfigError`; с переменными возвращает один и тот же клиент.
- **Gates:** lint ✅ | typecheck ✅ | test ✅ | build ✅
- **Impact:** `main.tsx` вызывает `initTelegram()` до рендера.

### Phase 3: оболочка «Lapa», вкладки, состояния, локализация
- **Status:** pending
- **Files:** `src/App.tsx`, `src/App.test.tsx`, `src/components/TabBar.tsx`, `src/components/ScreenState.tsx`, `src/components/ScreenState.test.tsx`, `src/screens/{Nearby,Catalog,Bookings,Shop,Pet}Screen.tsx`, `src/i18n/ru.ts`, `src/styles.css`
- **Changes:** заголовок «Lapa»; `TabBar` из пяти кнопок (`role="tablist"`/`tab`, `aria-selected`, высота ≥ 44 px); экраны показывают `ScreenState` со статусом «пусто» (Товары, Питомец — «скоро»); `ScreenState` с вариантами `loading` / `empty` / `error` (+ кнопка «Повторить» у ошибки); токены дизайна как CSS-переменные; шрифты.
- **TDD:**
  1. `App` вне Telegram рендерится без ошибок, виден «Lapa» и пять вкладок в нужном порядке (критерий «вне Telegram не падает» на уровне всего приложения);
  2. клик по вкладке показывает её экран, `aria-selected` переключается;
  3. `ScreenState` для каждого из трёх состояний показывает свой текст из `ru.ts`, у ошибки кнопка повтора вызывает колбэк;
  4. в компонентах нет кириллических литералов — проверка ESLint-правилом `no-restricted-syntax` по регулярке `[А-Яа-яЁё]` для `src/**/*.tsx` (кроме `src/i18n/`).
- **Gates:** lint ✅ | typecheck ✅ | test ✅ | build ✅; `npm run dev` + открыть в браузере (Playwright/Chromium, скриншот 390×844) — критерий «открывается в браузере».
- **Impact:** нет потребителей, кроме `main.tsx`.

### Phase 4: CI
- **Status:** pending
- **Files:** `.github/workflows/ci.yml`
- **Changes:** `on: [push, pull_request]`; `actions/checkout@v7`, `actions/setup-node@v7` (`node-version-file: .nvmrc`, `cache: npm`); `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`; `permissions: contents: read`.
- **TDD:** не применимо; проверка — зелёный прогон CI на push ветки (показать статус).
- **Gates:** CI зелёный на `feature/task-01-app-skeleton`.
- **Impact:** CI будет запускаться и на будущих ветках; секреты в CI не нужны (сборка без `.env`).

### После фаз (этапы 8–10)
- Этап 8: все проверки уровня 1 по всему проекту + `npm audit --audit-level=high` + циклы (если madge применим).
- Этап 9: ревью свежим контекстом агентом `code-reviewer` из скилла.
- Этап 10: `/security-review` по ветке.
- Отчёт по формату раздела 10 ТЗ; остановка для ревью Макса; PR только после его ревью.

## Challenge Loop (итог)
1. **Решает ли задачу:** критерии спеки → фазы: lint/typecheck/test/build (P1, P4), браузер (P3 скриншот), вне Telegram (P2 тест 1, P3 тест 1), секреты (Problem 4), Supabase env (P2), 5 вкладок и состояния (P3), локализация (P3 тест 4), 44 px (P3), Node 22 (P1, P4), audit (этап 8). Непокрытых критериев нет.
2. **Лучшее ли решение:** альтернативы и причины выбора — Решения 1–10.
3. **Нет ли кода ради кода:** без роутера, state-менеджера, UI-кита, `sdk-react`, PWA, i18n-библиотеки (простой объект строк). ESLint-правило про кириллицу добавлено, потому что оно напрямую проверяет критерий «строки только из файла локализации»; если Макс сочтёт лишним — заменим ручной проверкой.

## Вопросы к Максу
1. **Шрифты** (Решение 7): self-hosted `@fontsource-variable` (рекомендую: без внешних запросов, работает в слабой сети) или пока системные шрифты, чтобы не тянуть зависимости?
2. **Правило ESLint против кириллицы в компонентах** (Phase 3, тест 4): оставить (рекомендую: дёшево и автоматически держит правило локализации) или убрать?

## Changelog

| Date | Phase | Changes |
|------|-------|---------|
| 2026-10-09 | plan | первая версия плана |
