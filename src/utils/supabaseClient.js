import { createClient } from '@supabase/supabase-js';

// Anon/publishable key is safe to include here — it enforces RLS row-level
// security policies and is specifically designed to be public.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://xzpewkcymnzfverrpvfj.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rnhDHn_ICkiljFRX71GRjQ_SQkBXRHl';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = () => Boolean(supabase);
