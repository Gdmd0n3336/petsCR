# Research: TASK-01 каркас приложения
**Date:** 2026-10-08
**Task size:** M

## Current Architecture
Репозиторий содержит только документы и скилл (`CLAUDE.md`, `TASKS.md`, `TZ-bulletproof_1.md`, `README.md`, `.claude/`). Кода приложения нет (greenfield). Окружение: Node v22.22.0, npm 10.9.4. Схема Supabase уже применена (TASK-02), в репозитории миграций и типов ещё нет (это отдельная задача TASK-02-sync).

## Affected Areas
Все новые файлы в корне репозитория (приложение в корне, не в подпапке, чтобы `npm run ...` из раздела 5 ТЗ работали без `cd`).

| # | File/Module | Why affected |
|---|-------------|-------------|
| 1 | `package.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc` | сборка, типы, линт, формат, тесты |
| 2 | `src/lib/telegram.ts` | безопасная обёртка SDK (вне Telegram не падает) |
| 3 | `src/lib/supabase.ts`, `.env.example`, `src/vite-env.d.ts` | клиент Supabase, переменные окружения |
| 4 | `src/App.tsx`, `src/components/TabBar.tsx`, `src/screens/*` | оболочка «Lapa», 5 вкладок, состояния загрузка/пусто/ошибка |
| 5 | `src/i18n/ru.ts` | русские строки |
| 6 | `.github/workflows/ci.yml` | lint, typecheck, test, build на каждый push |
| 7 | `.gitignore` | `.env*`, `node_modules`, `dist` |

## Codebase Patterns
Пока нет. Следуем CLAUDE.md: минимальная сложность, mobile-first, тач-зоны от 44 px, строки только из файла локализации, секреты только в env, без микросервисов.

## Risks and Constraints
1. **Версии (проверено `npm view`, 2026-10-08):** TypeScript latest = 7.0.2, но `typescript-eslint@8.71.1` требует `typescript >=4.8.4 <6.1.0`. Значит TS нужно закрепить на 6.0.x (так же сделан актуальный шаблон `create-vite`: `typescript ~6.0.2`). Иначе линт сломается.
2. Vite 8.x требует Node `^20.19 || >=22.12`; Vitest 5 требует Node `^22.12 || ^24`. В CI использовать Node 22 (локально 22.22 подходит). Vitest 5 требует `@types/node ^22 || >=24`.
3. `@vitejs/plugin-react@6` рассчитан на Vite 8 (peer `vite ^8`). Брать связку Vite 8 + plugin-react 6 + Vitest 5.
4. Telegram: вне Telegram `window.Telegram.WebApp` отсутствует или пустой; любые вызовы SDK без проверки бросают исключение. Нужен единый модуль-обёртка и тест «вне Telegram не падает».
5. Supabase: ключ в браузере только publishable/anon. `service_role` в клиент нельзя. Вне настроенного `.env` приложение не должно падать при импорте (клиент создаётся лениво или с понятной ошибкой на экране, не белым экраном).
6. Шаблон `create-vite` уже использует `oxlint`, но ТЗ и CLAUDE.md не фиксируют линтер. ESLint (flat config) привычнее и совместим с typescript-eslint, oxlint быстрее. Решение вынесено в план (Challenge Log).
7. Нельзя ставить плагины и MCP «из интернета» вне описанного: допустимы только npm-зависимости проекта, перечисленные в плане.

## Open Questions
1. Какой тип сборки Mini App на проде (хостинг статики)? Для TASK-01 не нужен, решаем позже; `build` даёт статический `dist/`.
2. Нужна ли маршрутизация (react-router) уже в каркасе? Рекомендация: нет, пять вкладок = состояние в приложении; роутер добавим, когда понадобятся ссылки на карточки (TASK-06).
3. Точное имя экспорта проверки «мы в Telegram» в `@telegram-apps/sdk` (в документации Context7 не нашёл `isTMA` явно). Проверить по установленным типам в начале Phase 1; запасной вариант: `Boolean(window.Telegram?.WebApp?.initData)` без внешнего скрипта.

## Best Practices Found
- Vite: `import.meta.env.VITE_*`, типизация через `ImportMetaEnv` в `vite-env.d.ts`, только `VITE_`-переменные попадают в клиент (Context7, Vite v8.0.10, docs/guide/env-and-mode).
- Vitest 5: конфиг `test` внутри `vite.config.ts` (`/// <reference types="vitest/config" />`), `environment: 'jsdom'`, `setupFiles` с `@testing-library/jest-dom/vitest` (Context7, Vitest v5.0.3).
- Supabase: `createClient(url, publishableKey)`; в актуальной документации ключ называется publishable (`/supabase/supabase-js`).
- Telegram SDK 3.x: `init()` перед остальными вызовами, перед использованием метода проверять `isAvailable()` / `ifAvailable()` (Context7, docs.telegram-mini-apps.com).
- Шаблон `create-vite` react-ts: `tsc -b && vite build`, `type: module`.

## Conclusion & Recommendation
**Recommended approach:** Vite 8 + React 19 + TypeScript 6.0 (закреплён `~6.0`), Vitest 5 + Testing Library + jsdom, ESLint 10 (flat config) + typescript-eslint + react-hooks, Prettier, `@supabase/supabase-js`, `@telegram-apps/sdk` через одну обёртку `src/lib/telegram.ts`. Приложение в корне репозитория. Навигация вкладок как состояние без роутера. Строки в `src/i18n/ru.ts`.
**Key reasons:**
1. Vite это стандарт для SPA без SSR (SEO-страницы на Next.js ТЗ откладывает), быстрый dev, статическая сборка подходит для Mini App.
2. Vitest использует тот же конфиг Vite, нет второго транспайлера.
3. Закрепление TS 6.0 и одна обёртка Telegram снимают два главных технических риска (несовместимость линтера, падение вне Telegram).
**Risks of this approach:** экосистема версий новая и быстро меняется (поэтому точные версии фиксируем в `package-lock.json` и сверяем в Phase 1); `isTMA`/эквивалент нужно подтвердить по типам пакета.
