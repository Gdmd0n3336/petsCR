import { readConfig } from './config';

describe('readConfig', () => {
  it('falls back to sample mode, no map key and DEMO_MAP_ID when env is empty', () => {
    expect(readConfig({})).toEqual({
      supabase: null,
      mapsApiKey: null,
      mapsMapId: 'DEMO_MAP_ID',
      publicBaseUrl: null,
      telegramBot: null,
    });
  });

  it('accepts a Telegram bot name with or without @ and ignores invalid names', () => {
    expect(readConfig({ VITE_TELEGRAM_BOT: 'lapa_pets_bot' }).telegramBot).toBe('lapa_pets_bot');
    expect(readConfig({ VITE_TELEGRAM_BOT: ' @LapaBot ' }).telegramBot).toBe('LapaBot');
    for (const bad of ['', 'ab', 'lapa bot', 'https://t.me/lapa_bot', '1lapabot', 'lapa/bot?x']) {
      expect(readConfig({ VITE_TELEGRAM_BOT: bad }).telegramBot).toBeNull();
    }
  });

  it('needs both Supabase variables to switch to live mode', () => {
    expect(readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co' }).supabase).toBeNull();
    expect(
      readConfig({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })
        .supabase,
    ).toEqual({ url: 'https://x.supabase.co', key: 'k' });
  });

  it('uses the configured map id and treats blank values as missing', () => {
    expect(readConfig({ VITE_GOOGLE_MAPS_MAP_ID: 'abc123' }).mapsMapId).toBe('abc123');
    expect(readConfig({ VITE_GOOGLE_MAPS_API_KEY: '  ' }).mapsApiKey).toBeNull();
  });
});

describe('test environment', () => {
  it('runs without the developer keys from the shell (vite.config test.env)', () => {
    expect(readConfig()).toEqual({
      supabase: null,
      mapsApiKey: null,
      mapsMapId: 'DEMO_MAP_ID',
      publicBaseUrl: null,
      telegramBot: null,
    });
  });
});
