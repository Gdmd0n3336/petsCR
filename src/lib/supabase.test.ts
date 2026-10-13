import { getSupabase, SupabaseConfigError } from './supabase';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getSupabase', () => {
  it('throws SupabaseConfigError when env variables are missing', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    expect(() => getSupabase()).toThrow(SupabaseConfigError);
  });

  it('returns the same client instance when configured', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key');
    const first = getSupabase();
    expect(first).toBe(getSupabase());
  });
});
