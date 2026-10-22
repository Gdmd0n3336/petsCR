# Research: TASK-06 каталог, карта, карточка заведения
**Date:** 2026-10-21
**Task size:** L (этапы 1–12 без деплоя)
**Вход:** `TASK-06.md` (вложение Макса), `fixtures/catalog.sample.json` (11 заведений, 34 отзыва, 11 строк статистики)

## Проверки среды (2026-10-21)
1. **Supabase:** `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` в среде не заданы; прямой запрос к `fyvsfeiplqqaliqichye.supabase.co` отклонён прокси облачной среды (403, `connect_rejected`). → разработка на фикстурах; режим базы проверяется тестами с подменой клиента и у Макса.
2. **Google Maps:** `@googlemaps/js-api-loader` 2.1.3 — функциональный API `setOptions({ key, v: 'weekly' })` + `importLibrary('maps' | 'marker')`; класс `Loader` (v1) больше не работает. Маркеры — `AdvancedMarkerElement` (нужен `mapId`; `google.maps.Marker` устарел с 21.02.2024). Кластеризация — `@googlemaps/markerclusterer` 2.6.2, `new MarkerClusterer({ map, markers })`, поддерживает `AdvancedMarkerElement`. Источники: Context7 `/googlemaps/js-api-loader` (MIGRATION.md, setOptions), `/googlemaps/js-markerclusterer` (README, renderer.ts), `/websites/developers_google_maps_javascript` (libraries, advanced-markers/migration); версии — `npm view`. `maps.googleapis.com` из среды доступен (HTTP 200).
3. **Переменные окружения:** из переменных проекта не задана ни одна (`VITE_SUPABASE_*`, `VITE_GOOGLE_MAPS_*`, `SUPABASE_*`); `.env` нет, только `.env.example`. Заданы лишь служебные переменные среды (прокси, сертификаты, токены GitHub/облака).

## Current Architecture (main)
- Vite 8 + React 19 + TS 6.0, Vitest 5 (jsdom), ESLint 10 (+ `import-x/no-cycle`, запрет кириллицы в `src/**/*.tsx`), Prettier, CI.
- `src/App.tsx`: 5 вкладок через `useState`, `<nav>` + `aria-current`; экраны — `ScreenState` (loading/empty/error); строки в `src/i18n/ru.ts`.
- `src/lib/supabase.ts`: ленивый `getSupabase(): SupabaseClient<Database>`; `src/lib/telegram.ts`: `initTelegram()`.
- `src/types/database.types.ts`: устарел (нет полей Google, переводов, `venue_review_stats`).
- Роутера нет (решение TASK-01: добавить в TASK-06).
- На `main` пока нет TASK-03 (PR #3 открыт) и TASK-T (ветка) — при слиянии возможен конфликт в `database.types.ts` (блок `venues_import`), решается тривиально.

## Данные (по образцу)
- Районы в образце: Паттайя 4, Сирача 3, Чонбури 3, Банг Пхра 1 (в базе 13). Круглосуточных 2, с телефоном 10.
- Отзывы: th 22, en 11, ru 1; `text_ru = null` у 18, `text_en = null` у 13; оценки 5★ 23, 4★ 4, 3★ 2, 1★ 5; длинных (> 500 знаков) 5. У отзыва на русском `text_ru` заполнен, `needs_ru = false`.
- Часы работы: `"<тайский день>: <значение>; …"`, значения в образце: `H:MM to H:MM` (в т. ч. `to 0:00`), `เปิด 24 ชั่วโมง` (круглосуточно), `ปิดทำการ` (закрыто), `null`. В базе возможны и другие (несколько интервалов через запятую) → разбор с запасным показом сырого текста.
- Поля `needs_ru`/`needs_en` и представление `reviews_translation_queue` в базе есть, но **их миграции нет в репозитории** (в `20261020140247_…` их нет) — вопрос Максу.

## Risks and Constraints
1. **Нет доступа к базе** из среды → режим базы не проверить вживую; риск расхождения схемы и фикстур. Смягчение: валидация ответа на границе (схема), тесты слоя данных с подменой Supabase-клиента, проверка Максом.
2. **Ключ Google Maps в сборке.** Ключ Maps JavaScript API по устройству попадает в браузер (это публичный ключ, защищается ограничением по доменам в Google Cloud). Критерий «сборка не содержит ключей» выполним для CI-сборки без переменных и для отсутствия ключей в коде; в продакшн-сборке с ключом он будет в бандле — так задумано Google. Нужно подтверждение Макса.
3. **Map ID.** `AdvancedMarkerElement` требует `mapId`; для разработки есть `DEMO_MAP_ID`, для прода нужен свой Map ID (Google Cloud → Map Management, бесплатно). Предложение: `VITE_GOOGLE_MAPS_MAP_ID` (необязательная, по умолчанию `DEMO_MAP_ID`).
4. **Фикстуры в бандле.** 76 КБ образца не должны попасть в основной бандл — грузить динамическим `import()` только в демо-режиме.
5. **Поиск с транслитерацией** («Bay Vet» ↔ «Бэй Вет»): приведение к общему латинскому «скелету» (простая таблица кириллица→латиница, нижний регистр, без диакритики и пробелов-дефисов). Тайский — подстрока. Полная фонетика — вне рамок.
6. **Язык интерфейса** без `initData`: первый выбор — `navigator.language` (в Telegram WebView он соответствует языку приложения — не проверено), далее `localStorage` (с try/catch).
7. **«Поделиться» в Telegram:** без бота и `startapp` ссылка ведёт на веб-адрес карточки (`#/venue/<id>`) через `https://t.me/share/url?url=…`. Вопрос Максу: есть ли имя бота / Mini App для ссылки `t.me/<bot>/<app>?startapp=venue_<id>`.
8. **Маршрут:** Maps URLs `https://www.google.com/maps/dir/?api=1&destination=<lat>%2C<lng>` — без ключа (developers.google.com/maps/documentation/urls/guide).
9. Скилл `frontend-design` в этой сессии недоступен → опора на дизайн-систему прототипа из `TASK-06.md`.

## Best Practices Found
- js-api-loader v2: `setOptions` один раз, `importLibrary` по требованию; ошибка загрузки — `catch` → заглушка.
- Markerclusterer 2.6 с `AdvancedMarkerElement` и `SuperClusterAlgorithm` (по умолчанию).
- Supabase-js: выборка нужных колонок (`select('id, …')`), пагинация `.range(from, to)`, сортировка `.order()`.

## Conclusion & Recommendation
**Recommended approach:** слой данных `CatalogSource` с двумя реализациями (Supabase и фикстуры, автоматический выбор по наличию переменных, баннер «Демо-данные»), валидация ответов схемой valibot (уже в дереве зависимостей 1.5.0), кеш в памяти на сессию; хэш-роутинг на wouter (`#/venue/:id`, нужен для «Поделиться» и кнопки «Назад»); чистые функции для поиска/фильтров/сортировки, выбора текста отзыва и разбора часов — с тестами; карта на `@googlemaps/js-api-loader` v2 + `@googlemaps/markerclusterer` с заглушкой без ключа.
**Key reasons:** работает без доступа к базе (фикстуры) и без ключа карты (заглушка); правила показа 1–6 закодированы в чистых функциях и покрыты тестами; 165 заведений одним запросом, отзывы страницами по 10.
**Risks:** схема живой базы не проверена из среды; ключ карты публичен по устройству; нужен Map ID для прода.
