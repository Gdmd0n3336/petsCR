import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export class SupabaseConfigError extends Error {
  constructor() {
    super('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY');
    this.name = 'SupabaseConfigError';
  }
}

let client: SupabaseClient | undefined;

/** Клиент создаётся при первом использовании, чтобы без .env приложение открывалось. */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new SupabaseConfigError();
  client = createClient(url, key);
  return client;
}
