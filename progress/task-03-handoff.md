# Handoff: TASK-03 импорт OSM — после этапов 4–10
**Date:** 2026-10-19

## Done
- [x] Этапы 1–3 (research, spec, plan v2 по решениям Макса)
- [x] Phase 1–5: миграция `20261019120000_venues_import.sql` (переименовать после применения), `scripts/import-osm` (parse, sql, main), PGlite 0.5.10, README
- [x] Этап 8: lint/typecheck/test (66)/build/audit; реальный файл Макса: 51 объект (vet 27, grooming 2, boarding 1, pet_shop 21)
- [x] Этап 9: ревью — APPROVE WITH CHANGES; доказанные ошибки 1, 3, 4, 8 исправлены (872c956)
- [x] Этап 10: /security-review — уязвимостей нет
- [ ] Решение Макса по находке №2 (повторный импорт перезаписывает исправленную категорию)
- [ ] Переименовать миграцию по версии, которую сообщит Макс

## Open (из ревью, низкая важность, ждут решения)
5 запуск через симлинк; 6 EISDIR/ENOENT без русского сообщения; 7 регистр путей на macOS + строки в .gitignore; 9 общий экземпляр PGlite; 10 coalesce(osm_timestamp).
