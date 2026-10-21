import { readConfig } from './config';

describe('readConfig', () => {
  it('falls back to sample mode, no map key and DEMO_MAP_ID when env is empty', () => {
    expect(readConfig({})).toEqual({
      supabase: null,
      mapsApiKey: null,
      mapsMapId: 'DEMO_MAP_ID',
      publicBaseUrl: null,
    });
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
