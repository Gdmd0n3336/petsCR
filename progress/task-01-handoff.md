# Handoff: TASK-01 каркас приложения — после этапа 3 (план)
**Date:** 2026-10-09

## Goal
Пустой, но настоящий каркас Lapa (React + TS, Telegram Mini App + браузер) с lint/typecheck/test/build/dev и CI.

## Approach
Vite 8, React 19, TS ~6.0 (из-за typescript-eslint <6.1), Vitest 5 + jsdom, ESLint 10 + Prettier, @telegram-apps/sdk через обёртку с isTMA(), ленивый клиент Supabase, без роутера.

## Done
- [x] Этап 1: `thoughts/research/2026-10-08-task-01-app-skeleton.md`
- [x] Этап 2: `specs/2026-10-09-task-01-app-skeleton.md`
- [x] Этап 3: `plans/2026-10-09-task-01-app-skeleton.md`
- [ ] Phase 1–4 реализации (ждут подтверждения Макса)

## Current Problem / Next Step
Ответы Макса на 2 вопроса в плане (шрифты, ESLint-правило против кириллицы), затем «Implement Phase 1 according to plan».

## Key Files
- `plans/2026-10-09-task-01-app-skeleton.md` — фазы, Challenge Log, источники версий
- `specs/2026-10-09-task-01-app-skeleton.md` — критерии приёмки (контракт)

## Key Decisions Made
- Ветка `feature/task-01-app-skeleton` (push разрешён облаком), PR после ревью Макса.
- isTMA() подтверждён по типам @telegram-apps/sdk@3.11.8; запасной вариант window.Telegram.WebApp.initData.
