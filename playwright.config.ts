import { defineConfig } from '@playwright/test';

// Браузерные проверки раскладки (в jsdom её нет). Сборка без переменных окружения:
// образец данных, без Supabase и Google — тест не зависит от сети и ключей.
const PORT = 4174;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/`,
    locale: 'ru-RU',
    // Локально можно указать уже установленный Chromium (в CI — `playwright install chromium`).
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  },
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      VITE_SUPABASE_URL: '',
      VITE_SUPABASE_PUBLISHABLE_KEY: '',
      VITE_GOOGLE_MAPS_API_KEY: '',
      VITE_GOOGLE_MAPS_MAP_ID: '',
      VITE_PUBLIC_BASE_URL: '',
      VITE_TELEGRAM_BOT: '',
    },
  },
});
