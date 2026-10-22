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
  };
}
