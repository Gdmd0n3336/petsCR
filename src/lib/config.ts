type Env = Partial<Record<string, string | boolean | undefined>>;

export type AppConfig = {
  /** null — переменные Supabase не заданы, включается тестовый режим на образце данных. */
  supabase: { url: string; key: string } | null;
  /** null — ключа нет, вместо карты заглушка. */
  mapsApiKey: string | null;
  /** DEMO_MAP_ID по документации Google только для разработки, не для продакшна. */
  mapsMapId: string;
  /** Базовый адрес для ссылок «Поделиться»; по умолчанию текущий адрес страницы. */
  publicBaseUrl: string | null;
  /** Имя бота без @ для ссылок t.me/<бот>?startapp=…; null — ссылки ведут на веб-адрес. */
  telegramBot: string | null;
};

/** Имя бота Telegram: 5–32 символа, латиница, цифры и подчёркивание. Неверное имя — как пустое. */
const botName = (value: unknown) => {
  const name = text(value)?.replace(/^@/, '') ?? null;
  return name && /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(name) ? name : null;
};

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);

export function readConfig(env: Env = import.meta.env): AppConfig {
  const url = text(env.VITE_SUPABASE_URL);
  const key = text(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  return {
    supabase: url && key ? { url, key } : null,
    mapsApiKey: text(env.VITE_GOOGLE_MAPS_API_KEY),
    mapsMapId: text(env.VITE_GOOGLE_MAPS_MAP_ID) ?? 'DEMO_MAP_ID',
    publicBaseUrl: text(env.VITE_PUBLIC_BASE_URL),
    telegramBot: botName(env.VITE_TELEGRAM_BOT),
  };
}
