import { createClient } from '@supabase/supabase-js';

let supabase: ReturnType<typeof createClient>;

export function getSupabase() {
  if (!supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL or SUPABASE_KEY not configured');
    }
    supabase = createClient(url, key);
  }
  return supabase;
}
