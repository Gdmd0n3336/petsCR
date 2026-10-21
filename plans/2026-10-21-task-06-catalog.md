# Plan: TASK-06 каталог, карта, карточка заведения
**Date:** 2026-10-21 · **Size:** L · **Branch:** `feature/task-06-catalog`
**Spec:** `specs/2026-10-21-task-06-catalog.md` · **Research:** `thoughts/research/2026-10-21-task-06-catalog.md`

## Итог проверок среды
1. Supabase: недоступна — переменные не заданы, хост проекта отклонён прокси (403) → разработка на фикстурах.
2. Google Maps: `@googlemaps/js-api-loader` 2.1.3 (`setOptions` + `importLibrary`), `AdvancedMarkerElement` + `mapId`, `@googlemaps/markerclusterer` 2.6.2 (Context7 + `npm view`).
3. Переменные окружения: ни одной переменной проекта; `.env` нет.

## Challenge Log (решения и почему)
| Вопрос | Варианты | Решение | Причина |
|---|---|---|---|
| Источник данных | прямые вызовы Supabase в экранах / слой `CatalogSource` | `CatalogSource` с двумя реализациями (`supabaseSource`, `fixtureSource`), выбор по наличию `VITE_SUPABASE_*` | работает без базы; экраны тестируются без сети; одно место для «только чтение, только нужные колонки» |
| Проверка ответов | ручные проверки / zod / valibot | valibot 1.5 (`safeParse` построчно, плохая строка отбрасывается) | маленький, tree-shaking, уже в дереве зависимостей; усложнение названо: +1 зависимость ради правила «валидировать на границе» |
| Роутинг | `useState` / wouter / react-router | wouter 3.13 с `useHashLocation` (`#/venue/:id`) | ~2 КБ; хэш не требует настройки хостинга и Telegram; нужен для «Поделиться» и «Назад» |
| Кеш | react-query / Map в памяти | `Map` в модуле источника (заведения — один промис; отзывы — ключ `venue+sort+filter+page`) | требование «кеш на сессию», без новой зависимости |
| Фикстуры | статический импорт / `import()` | `fixtures/catalog.sample.json` через динамический `import()` | отдельный чанк, не в основном бандле (тест на сборку) |
| Поиск | подстрока / fuse.js / скелет | нормализация: нижний регистр, NFKD без диакритики, кириллица→латиница по таблице, схлопывание гласных-«похожих» (e/э, y/й/и), без пробелов и дефисов; тайский — подстрока | «Bay Vet» ↔ «Бэй Вет» без нечёткого поиска (его ТЗ запрещает: «без автоисправления») |
| Язык | `initData` / `navigator.language` + `localStorage` | `navigator.language` для первого выбора, далее `localStorage` (try/catch); контекст `LocaleProvider`; словари `ru.ts`, `en.ts` с одним типом | правило 2; `initData` не используем |
| Текст отзыва | — | чистая функция `pickReviewText(review, lang, showOriginal)` → `{ text, label: 'auto' \| 'soon' \| null, canToggle }` | правила 3–4 в одном месте; шаблонный перевод невозможен: функция только выбирает из `text_ru/text_en/text` |
| Часы работы | — | `parseOpeningHours(raw)` → 7 дней `{ day, kind: 'range' \| '24h' \| 'closed', ranges }` или `null` → показ сырого текста | неизвестный формат не теряется |
| Карта | `@vis.gl/react-google-maps` / js-api-loader + markerclusterer | js-api-loader 2 + markerclusterer 2.6 в одном компоненте `VenueMap` | меньше зависимостей, официальный способ из docs; без ключа загрузчик не вызывается вовсе |
| Map ID | обязателен / `DEMO_MAP_ID` | `VITE_GOOGLE_MAPS_MAP_ID` необязательная, по умолчанию `DEMO_MAP_ID` | `AdvancedMarkerElement` требует `mapId` (вопрос 1) |
| Геолокация | — | `navigator.geolocation.getCurrentPosition` по нажатию, расстояние по гаверсинусу | сортировка «по расстоянию» видна только после разрешения |
| «Поделиться» | `t.me/share/url` / `startapp` | `https://t.me/share/url?url=<адрес карточки>`; в Telegram — `openTelegramLink` | без имени бота (вопрос 3) |
| «Маршрут» | — | `https://www.google.com/maps/dir/?api=1&destination=<lat>%2C<lng>`, `target=_blank rel=noopener`; в Telegram — `openLink` | без ключа |

## Слой данных (что именно запрашивается)
- `venues`: `select('id, category, name_ru, name_en, name_th, district, lat, lng, phone, website, opening_hours, is_24_7, address, google_rating, google_reviews_count, google_place_id, is_demo')` + `eq('is_published', true)` — один запрос.
- `venue_review_stats`: `select('venue_id, reviews_count, avg_rating')` — один запрос, вместе с заведениями.
- `reviews`: `select('id, venue_id, author_display, rating_overall, text, text_lang, review_date, price_paid, source_url, text_ru, text_en, needs_ru, needs_en')` + `eq('venue_id')` + `eq('is_published', true)` + опционально `eq('rating_overall', n)` + `order(review_date desc | rating_overall asc)` + `range(from, from+9)`.
- Только `select`; таблицы `*_import`, `venue_line_links`, `reviews_translation_queue` не упоминаются в коде (тест-грep).
- Ошибки в интерфейсе — общее сообщение «Не удалось загрузить», без URL и ключей; подробность только `console.error` в dev.

## Структура файлов
```
src/lib/catalog/        types.ts, schema.ts (valibot), source.ts (выбор), supabaseSource.ts, fixtureSource.ts, cache
src/lib/                search.ts, filters.ts (фильтры+сортировки), geo.ts, reviewText.ts, openingHours.ts, links.ts, maps.ts
src/i18n/               ru.ts, en.ts, locale.tsx (провайдер, useT, переключатель)
src/components/         VenueCard, RatingBlock, Stars(с текстом), ReviewItem, ReviewList, FilterBar, DemoBanner, LangSwitch, SoonDialog, VenueMap, MapFallback
src/screens/            CatalogScreen (список/карта), NearbyScreen, VenueScreen
fixtures/catalog.sample.json
```

## Фазы (TDD: сначала тест, затем код)
### Фаза 1. Типы и слой данных
- Тесты: схема отбрасывает строку с `lat: "abc"`/`rating_overall: 9` и не роняет список; supabaseSource вызывает только `from().select(<точные колонки>)`, без `insert/update/delete/rpc`; отзывы — `range(0,9)`, затем `range(10,19)`; кеш: повторный вызов не ходит в клиент; без env выбирается fixtureSource и флаг `isDemo`.
- Код: `types.ts`, `schema.ts`, `supabaseSource.ts`, `fixtureSource.ts`, `source.ts`; `.env.example` (+`VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`).
### Фаза 2. Язык интерфейса
- Тесты: первый выбор по `navigator.language` (`en-US`→en, `th`→ru), сохранение и чтение из `localStorage`, `localStorage` бросает — работает; словари `ru`/`en` имеют одинаковые ключи (тип).
- Код: `en.ts`, `locale.tsx`, `LangSwitch`; правило ESLint против кириллицы остаётся.
### Фаза 3. Каталог: поиск, фильтры, сортировка
- Тесты (по одному на каждый фильтр и порядок): «Bay Vet» находит «Бэй Вет» и наоборот, тайский подстрокой, регистр; «Круглосуточно»; район; «Есть телефон»; сочетание фильтров; сортировки по рейтингу Google (null в конце), по числу отзывов, по расстоянию (без координат в конце); сортировка «по расстоянию» скрыта без геолокации; пустой результат → состояние «пусто»; ошибка источника → «ошибка» с «Повторить»; баннер «Демо-данные».
- Код: `search.ts`, `filters.ts`, `geo.ts`, `FilterBar`, `VenueCard`, `CatalogScreen`, роутер wouter в `App.tsx`.
### Фаза 4. Карточка и отзывы → **остановка 2 (скриншоты)**
- Тесты: правило 1 (имя по языку, запасной `name_th`); `pickReviewText` — перевод есть («Автоперевод» + «Показать оригинал»), перевода нет («Перевод скоро», оригинал), оригинал на языке интерфейса (без подписей и кнопки), переключатель туда-обратно, длинный текст («Показать полностью»); текст `<b>x</b>` выводится как текст; два рейтинга раздельно с подписями; звёзды с `aria-label`/текстом; часы: обычные, `เปิด 24 ชั่วโมง`, `ปิดทำการ`, `8:00 to 0:00`, непонятный формат → сырой текст; ссылки `tel:`, «Маршрут», «Сайт» (нет сайта — нет кнопки), «Поделиться»; «Записаться или спросить» → окно «Скоро»; подгрузка «Ещё» (страница 2), сортировка «Новые / Сначала низкие», фильтр по оценке; неизвестный id → «пусто».
- Код: `reviewText.ts`, `openingHours.ts`, `links.ts`, `RatingBlock`, `Stars`, `ReviewItem`, `ReviewList`, `SoonDialog`, `VenueScreen`.
- Скриншоты 390×844 (Playwright вне зависимостей проекта): каталог, фильтры, карточка с переведённым и непереведённым отзывом, английский интерфейс.
### Фаза 5. Карта → **остановка 3**
- Тесты: без ключа — заглушка и список работает, загрузчик не вызывается; ошибка `importLibrary` → заглушка; маркеры создаются по каждому заведению с координатами (без координат — пропуск), нажатие → превью с «Открыть» (моки `google.maps`); кластеризатор получает маркеры; сборка без env не содержит строк `AIza` и URL проекта (скрипт-проверка `dist/`).
- Код: `maps.ts`, `VenueMap`, `MapFallback`, переключатель «Список / Карта»; на десктопе две панели.
### Фаза 6. Вкладка «Рядом»
- Тесты: разрешение → ближайшие по расстоянию; отказ/нет API → популярные (по `google_reviews_count`), с пояснением.
- Код: `NearbyScreen`.
### Затем этапы 8–12 (без деплоя)
Ревью (код, безопасность), `npm audit`, lint/typecheck/test/build, CI зелёный, отчёт по разделу 10 → **остановка 4**.

## Новые зависимости (нужно разрешение)
`wouter@3.13.0`, `valibot@1.5.0`, `@googlemaps/js-api-loader@2.1.3`, `@googlemaps/markerclusterer@2.6.2`; dev: `@types/google.maps@3.66.7`. Версии закрепить точно.

## Источники сверки
Context7: `/googlemaps/js-api-loader`, `/googlemaps/js-markerclusterer`, `/websites/developers_google_maps_javascript`; developers.google.com/maps/documentation/urls/guide; `npm view` для версий. Перед реализацией дополнительно: wouter (`useHashLocation`), valibot (`safeParse`), supabase-js (`range`, `order`).

## Вопросы к Максу
1. `VITE_GOOGLE_MAPS_MAP_ID`: заведёшь свой Map ID или пока `DEMO_MAP_ID`?
2. Ключ Maps JS API по устройству попадает в браузер. Критерий «сборка не содержит ключей» понимаю так: в коде ключей нет, CI-сборка без переменных ключей не содержит, а защита боевого ключа — ограничение по доменам в Google Cloud. Верно?
3. Есть ли имя бота / Mini App для ссылки `t.me/<bot>/<app>?startapp=venue_<id>`? Пока «Поделиться» ведёт на веб-адрес карточки.
4. В репозитории нет миграции с `needs_ru`/`needs_en` и `reviews_translation_queue` (в `20261020140247_…` их нет). Пришлёшь файл?
5. Разрешаешь зависимости из списка выше?
6. Доступ к базе: добавить `fyvsfeiplqqaliqichye.supabase.co` в Allowed domains среды и задать `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` в переменных среды — тогда проверю режим базы вживую.

## Решения владельца (2026-10-21) и выбор зависимостей
| Вопрос | Решение |
|---|---|
| Map ID | `VITE_GOOGLE_MAPS_MAP_ID`, пусто → `DEMO_MAP_ID`. Справочник Google (Map class → Constants): `DEMO_MAP_ID` «not intended for use in production applications» → владельцу завести свой Map ID (инструкция в отчёте). |
| Ключ карты | В коде и CI-сборке без переменных ключа нет: `scripts/check-bundle.mjs` ищет `AIza…` и адрес Supabase в `dist/`, шаг CI `check:bundle`. Боевой ключ защищает владелец: домены, только Maps JavaScript API, дневная квота. |
| «Поделиться» | `VITE_PUBLIC_BASE_URL` (пусто → текущий адрес); `venueShareTarget()` — точка расширения для `t.me/<bot>/<app>?startapp=venue_<id>`. |
| Геолокация | Мягкий отказ: ошибка/отказ/нет API → `unavailable`, без сообщений; «Рядом» показывает популярные. |
| Баннер | «Тестовый режим: образец данных». |

| Пакет | Версия | Свежесть (npm, 2026-10-21) | Лицензия | Почему |
|---|---|---|---|---|
| wouter | 3.13.0 | 2026-09-30 | Unlicense | хэш-роутинг `useHashLocation`, ~2 КБ, peer react ≥16.8 |
| valibot | 1.5.0 | 2026-09-09 | MIT | схема на границе; та же версия, что закреплена override для `@telegram-apps/sdk` → одна копия в дереве (`npm ls valibot`: deduped) |
| @googlemaps/js-api-loader | 2.1.3 | 2026-09-22 | Apache-2.0 | официальный загрузчик, `setOptions` + `importLibrary` |
| @googlemaps/markerclusterer | 2.6.2 | 2026-05-14 | Apache-2.0 | официальная кластеризация, поддерживает `AdvancedMarkerElement` |
| @types/google.maps | 3.66.7 (dev) | 2026-10-15 | MIT | типы Maps JS API |

`npm audit`: 0 уязвимостей. В CI добавлен `npm audit --audit-level=high`.

## Отклонения от плана (фазы 1–4)
- `source_url` отзывов не запрашивается: на экране не используется (лишние данные не попадают в браузер). `is_demo` у заведений и отзывов запрашивается — для пометки «демо-данные» (CLAUDE.md).
- «По числу отзывов» сортирует по `google_reviews_count` (это число видно на карточке).
- Отзыв без перевода: кнопки переключения нет (переключать не на что), только подпись «Перевод скоро».

## Поправка владельца: районы (2026-10-21)
- Миграция `20261021090011_venues_area_labels.sql` (применена владельцем) положена без изменений; типы `venues` дополнены `area_ru`/`area_en`.
- Фильтр «Район» и подпись района строятся по `area_ru` (значение) и `area_en` (английская подпись из базы, пусто → русская). Колонка `district` больше не запрашивается; жёсткий список районов из кода удалён. Районов 9.
- Поиск дополнительно сравнивает запрос с `area_ru`/`area_en`: подстрока или совпадение «скелета» целиком от 5 букв (`Sriracha`, `Sri Racha` → Si Racha; `Bangsaen` → Bang Saen); короткие запросы вроде «pet» не находят всю Pattaya.
- Образец данных снят до миграции: в тестовом режиме при отсутствии `area_*` район берётся из старого `district`, английского названия нет (показывается русское).

## Поправка владельца: название заведения (2026-10-21)
- Миграция `20261021090526_venues_name_original.sql` (применена владельцем) положена без изменений; типы `venues` дополнены `name_original`; колонка добавлена в запрос.
- Правило 1 заменено: показываем `name_original` без перевода (запасная цепочка `name_th` → `name_en` → `name_ru`); кнопка «По-русски» / «In English» показывает `name_ru` / `name_en` с подписью «транслитерация», повторное нажатие («Оригинал» / «Original») возвращает оригинал. Кнопки нет, если транслитерации нет или она совпадает с оригиналом. В «Поделиться» уходит оригинальное название.
- Поиск по названию — по всем четырём полям (`name_original`, `name_th`, `name_en`, `name_ru`).
- Образец данных: `name_original` добавлен каждому из 11 заведений как `name_th`, а если его нет — `name_en` (в образце нет исходного названия Google; в базе поле заполнено владельцем). Остальное в файле не менялось.
