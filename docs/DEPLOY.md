# Выкладка Lapa на Cloudflare

Приложение выкладывается на **Cloudflare Workers** как набор статических файлов. Cloudflare сам забирает код из GitHub, собирает его и публикует. После настройки каждое изменение в ветке `main` выкладывается автоматически.

Инструкция для человека без опыта разработки. Сверено с документацией Cloudflare 22.10.2026 (ссылки внизу).

## Что понадобится

- Аккаунт Cloudflare (бесплатного тарифа достаточно).
- Доступ к GitHub-аккаунту, где лежит репозиторий `petsCR`.
- Четыре значения (их вписываете только вы, в панели Cloudflare; в чат, в репозиторий и в письма их не отправлять) и `DO_NOT_TRACK=1`:

| Переменная | Где взять |
|---|---|
| `VITE_SUPABASE_URL` | Supabase → проект `lapa` → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | там же, publishable-ключ (**не** `service_role`!) |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Cloud → APIs & Services → Credentials → ключ Maps JavaScript API |
| `VITE_GOOGLE_MAPS_MAP_ID` | Google Cloud → Google Maps Platform → Map Management → ваш Map ID |
| `VITE_TELEGRAM_BOT` | имя бота без `@` (не секрет), см. раздел «Бот Telegram» ниже; пусто — «Поделиться» ведёт на веб-адрес |
| `DO_NOT_TRACK` | значение `1` (не секрет): отключает телеметрию инструментов сборки, которые учитывают этот стандарт; в приложение не попадает |

Все четыре значения по своей природе видны в браузере пользователя: это нормально для publishable-ключа Supabase (данные защищены правилами доступа в базе) и для ключа карты (его защищают ограничения в Google Cloud, см. шаг 8). Ключ `service_role` сюда класть нельзя никогда.

## Шаг 1. Открыть раздел Workers

1. Зайдите на [dash.cloudflare.com](https://dash.cloudflare.com) и войдите.
2. В меню слева откройте **Workers & Pages** (может находиться внутри раздела **Compute**).

## Шаг 2. Создать приложение из репозитория

1. Нажмите **Create application**.
2. Рядом с пунктом **Import a repository** нажмите **Get started**.

## Шаг 3. Подключить GitHub (один раз)

1. В поле **Git account** выберите GitHub и следуйте подсказкам: откроется GitHub с запросом на установку приложения **Cloudflare Workers and Pages**.
2. В разделе **Repository access** выберите **Only select repositories** и отметьте **только** `petsCR`. Доступ ко всем репозиториям давать не нужно.
3. Нажмите **Install & Authorize** (или **Save**) и вернитесь в Cloudflare.

Проверить или поменять доступ позже можно на GitHub: Settings → Applications → Cloudflare Workers and Pages → Configure.

## Шаг 4. Выбрать репозиторий

В списке репозиториев выберите `petsCR` (можно найти поиском).

## Шаг 5. Настроить проект

Заполните поля ровно так:

| Поле | Значение |
|---|---|
| **Project name** (имя Worker) | `lapa-app` — именно так, иначе сборка упадёт: имя должно совпадать с `name` в файле `wrangler.jsonc` |
| **Production branch** | `main` |
| **Build command** | `npm run build` |
| **Deploy command** | `npx wrangler deploy` |
| **Root directory / Path** | оставить пустым (корень репозитория) |

Затем раскройте **Advanced settings** и найдите **Build variables** (переменные сборки). Добавьте пять переменных из таблицы выше (четыре `VITE_*` и `DO_NOT_TRACK` = `1`): имя — слева, значение — справа.

> Важно: это именно **переменные сборки** (Build variables). Сборщик Vite вшивает их в файлы приложения во время `npm run build`. Раздел **Settings → Variables & Secrets** (переменные во время работы Worker) для нашего приложения не подходит: туда их класть бесполезно.

Версию Node.js Cloudflare берёт из файла `.nvmrc` в репозитории (там `22`), отдельно указывать не нужно.

## Шаг 6. Запустить первую выкладку

1. Нажмите **Save and Deploy** (или **Deploy**).
2. Откроется журнал сборки. В нём по очереди будут:
   - установка зависимостей (npm);
   - `npm run build` — в конце строка `✓ built in …`;
   - `npx wrangler deploy` — в конце адрес вида `https://lapa-app.<ваш-поддомен>.workers.dev`.
3. Если сборка красная — откройте журнал, скопируйте последние 30–40 строк (в них нет секретов) и пришлите разработчику.

Свой поддомен `<ваш-поддомен>` виден в **Workers & Pages** → справа **Account details** / **Subdomain** (или в адресе из журнала).

## Шаг 7. Проверить, что всё работает

Откройте `https://lapa-app.<ваш-поддомен>.workers.dev/` на телефоне или в браузере.

| Что сделать | Что должно быть видно |
|---|---|
| Открыть адрес | Заголовок **Lapa**, вкладка «Рядом» со списком заведений. **Жёлтой плашки «Тестовый режим: образец данных» быть не должно.** |
| Вкладка «Каталог» | «Найдено: 165» (или текущее число заведений в базе), фильтр «Район» с районами |
| Переключатель «Карта» | Карта Google с зелёными кругами-кластерами; нажатие на маркер открывает карточку снизу с кнопкой «Открыть» |
| Открыть любое заведение | Название, два рейтинга (Google и «Собрано отзывов»), кнопки, отзывы |
| Кнопка RU/EN вверху | Интерфейс переключается на английский и обратно |
| Открыть `https://lapa-app.<ваш-поддомен>.workers.dev/abc` | Открывается то же приложение, а не страница ошибки |

Если что-то не так:

- **Жёлтая плашка «Тестовый режим»** — переменные Supabase не попали в сборку. Проверьте имена (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, без пробелов) в **Settings → Build → Build variables and secrets** и пересоберите (шаг «Обновление» ниже).
- **«Карта пока не подключена»** — нет переменной `VITE_GOOGLE_MAPS_API_KEY` в сборке.
- **«Карта сейчас недоступна»** — Google отклонил ключ: чаще всего адрес сайта не добавлен в ограничения ключа (шаг 8) или в ключе не включён Maps JavaScript API.

## Шаг 8. Ограничить ключ Google по адресу сайта

Google Cloud → APIs & Services → Credentials → ваш ключ карты.

1. **Application restrictions** → **Websites** (HTTP referrers). Добавьте ровно эти две записи — основной адрес, подставив свой поддомен вместо `<поддомен>`:

   | Адрес | Зачем |
   |---|---|
   | `https://lapa-app.<поддомен>.workers.dev` | основной адрес (сама страница) |
   | `https://lapa-app.<поддомен>.workers.dev/*` | основной адрес (все пути) |

   Для Telegram отдельной записи не нужно: Mini App открывает тот же адрес. Для разработки на компьютере (`localhost`) используйте отдельный ключ разработчика, в боевой ключ `localhost` не добавляйте.
2. **API restrictions** → **Restrict key** → оставьте только **Maps JavaScript API**.
3. Поставьте дневную квоту (APIs & Services → Maps JavaScript API → Quotas) и бюджетное оповещение в Billing.
4. Сохраните. Изменения в Google применяются до 5 минут. Затем снова откройте карту (шаг 7).

Если позже подключите свой домен (например `lapa.example`), добавьте в ограничения `https://lapa.example` и `https://lapa.example/*`.

## Обновление

- Каждое изменение, попавшее в ветку `main` на GitHub, Cloudflare собирает и выкладывает сам. Статус — в Worker → **Deployments**.
- **Поменяли переменную сборки** — нужна новая сборка: Worker → **Deployments** → у последней сборки **Retry build** (или любое новое изменение в `main`). Без пересборки старые значения остаются в файлах приложения.

## Предпросмотры веток (необязательно)

Cloudflare умеет собирать отдельную копию приложения для каждой ветки, кроме `main`: Worker → **Settings** → **Builds** → включить **Builds for non-production branches** (в новой панели — **Previews**). Эта функция у Cloudflare в статусе бета. Включайте её, только если нужны предпросмотры. Карта Google на адресах предпросмотров работать не будет: ключ ограничен только основным адресом (шаг 8), остальное приложение работает.

## Безопасность

- API-токены Cloudflare создавать и класть в репозиторий не нужно: при подключении через GitHub Cloudflare сам создаёт токен для сборок.
- Переменные сборки вписываются только в панели Cloudflare.
- Перед каждой выкладкой в GitHub проверяется, что в сборке без переменных нет ключей (`npm run check:bundle` в CI).

## Вариант Pages (так выкладывает владелец)

Приложение выложено через **Cloudflare Pages**: адрес `https://lapa-app.pages.dev`. Это равноценная замена шагам 1–7 выше (Workers); шаги 7 «Проверить» и 8 «Ключ Google» остаются в силе с адресами Pages.

Настройки проекта Pages (Workers & Pages → Create → Pages → Connect to Git → репозиторий `petsCR`):

| Поле | Значение |
|---|---|
| Production branch | `main` |
| Framework preset | `None` (или `Vite`, если предложит) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | пусто |

**Переменные сборки** (Settings → Variables and Secrets, тип Plaintext, для Production и при необходимости Preview): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GOOGLE_MAPS_MAP_ID`, `VITE_TELEGRAM_BOT`, `DO_NOT_TRACK=1` и **`NODE_VERSION=22`** — по умолчанию в сборке Pages стоит Node.js 18, а проекту нужен 22. После изменения переменных — новая сборка (Deployments → Retry deployment).

**Ключ Google** (шаг 8), записи для Pages:

| Адрес | Зачем |
|---|---|
| `https://lapa-app.pages.dev/*` | основной адрес |
| `https://*.lapa-app.pages.dev/*` | предпросмотры Pages (`<хеш>.lapa-app.pages.dev` и `<ветка>.lapa-app.pages.dev`) |

**`wrangler.jsonc` при выкладке через Pages не используется** и сборке не мешает. По документации Pages файл Wrangler становится конфигурацией проекта Pages (и источником правды вместо панели) только если в нём есть ключ `pages_build_output_dir`. В нашем `wrangler.jsonc` этого ключа нет: он описывает Worker (`assets.directory`), поэтому Pages берёт настройки из панели (таблица выше). В журнале сборки Pages может появиться предупреждение о том, что файл Wrangler найден, но не подходит для Pages и пропущен, — это ожидаемо. Ключ `pages_build_output_dir` в файл не добавлять: тогда панель перестанет управлять настройками проекта.

Маршруты: в сборке нет файла `404.html`, поэтому Pages отдаёт приложение на любой путь (режим одностраничного приложения); маршруты приложения к тому же живут после `#`.

## Бот Telegram и ссылки на карточки

1. В @BotFather у бота настройте **главное Mini App** (Main Mini App) с адресом приложения, например `https://lapa-app.pages.dev`.
2. В переменные сборки добавьте `VITE_TELEGRAM_BOT` = имя бота без `@` и пересоберите.
3. Кнопка «Поделиться» на карточке даёт ссылку `https://t.me/<бот>?startapp=venue_<id>`. Telegram передаёт `venue_<id>` в приложение (`start_param`), и оно сразу открывает карточку. Другие значения `startapp` игнорируются.
4. Язык при первом запуске в Telegram: русский, если язык Telegram русский или не определён, иначе английский. Дальше действует выбор RU/EN в шапке.

Проверка: откройте ссылку из «Поделиться» в Telegram — должна открыться карточка того же заведения, «Назад» ведёт в каталог.

## Источники

- Workers Builds, подключение репозитория и настройки сборки: <https://developers.cloudflare.com/workers/ci-cd/builds/> и <https://developers.cloudflare.com/workers/ci-cd/builds/configuration/>
- Требование совпадения имени Worker: <https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/#workers-name-requirement>
- Версия Node.js в сборке (`.nvmrc`): <https://developers.cloudflare.com/workers/ci-cd/builds/build-image/>
- Статические файлы и режим SPA: <https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/>
- Адреса предпросмотров: <https://developers.cloudflare.com/workers/previews/> и <https://developers.cloudflare.com/workers/configuration/previews/>
- Главное Mini App и ссылки `t.me/<бот>?startapp=…`: <https://core.telegram.org/bots/webapps#launching-the-main-mini-app>
- Pages: файл Wrangler и `pages_build_output_dir` — <https://developers.cloudflare.com/pages/functions/wrangler-configuration/>; версия Node.js в сборке — <https://developers.cloudflare.com/pages/configuration/build-image/>; адреса предпросмотров — <https://developers.cloudflare.com/pages/configuration/preview-deployments/>; режим SPA — <https://developers.cloudflare.com/pages/configuration/serving-pages/>
- Ограничения ключа Google по адресам: <https://cloud.google.com/api-keys/docs/add-restrictions-api-keys>
