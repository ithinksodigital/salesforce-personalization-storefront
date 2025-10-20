import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from './database.types';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Create a new Supabase client instance
 */
export function createClient(): ReturnType<typeof createSupabaseClient<Database>> {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}
