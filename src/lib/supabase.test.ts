// Модуль кеширует клиент, поэтому каждый тест загружает его заново (не зависит от порядка).
async function loadSupabase() {
  vi.resetModules();
  return import('./supabase');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSupabase', () => {
  it('throws SupabaseConfigError when env variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    const { getSupabase, SupabaseConfigError } = await loadSupabase();
    expect(() => getSupabase()).toThrow(SupabaseConfigError);
  });

  it('returns the same client instance when configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');
    const { getSupabase } = await loadSupabase();
    expect(getSupabase()).toBe(getSupabase());
  });
});
