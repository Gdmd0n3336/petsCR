# Handoff: TASK-03 импорт OSM — после этапа 3 (план)
**Date:** 2026-10-19

## Goal
Воспроизводимая выгрузка заведений Чонбури из OSM в `venues_import` без дублей и без затирания решений.

## Approach
Node-скрипт (TS, без новых runtime-зависимостей): один запрос Overpass с повтором и паузой → сырой JSON вне репозитория → журнал → SQL-файл (`jsonb_to_recordset` + `on conflict`), который Макс выполняет в SQL Editor. Миграция `venues_import` по образцу `venue_line_links`.

## Done
- [x] Этап 1: `thoughts/research/2026-10-19-task-03-osm-import.md`
- [x] Этап 2: `specs/2026-10-19-task-03-osm-import.md`
- [x] Этап 3: `plans/2026-10-19-task-03-osm-import.md`
- [ ] Phase 1–5 (ждут решений Макса)

## Next Step
Ответы Макса на 3 вопроса плана (доступ к БД A/B/C, PGlite, ODbL), затем «Implement Phase 1 according to plan».

## Key Decisions Made
- Overpass недоступен из облачной среды (403 прокси) → реальный запрос делает Макс, тесты на файле-образце.
- PGlite-прототип подтвердил: upsert через jsonb_to_recordset идемпотентен, status сохраняется, «злые» теги целы.
