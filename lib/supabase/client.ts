import { createBrowserClient } from "@supabase/ssr";

import { readSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  const { supabaseAnonKey, supabaseUrl } = readSupabaseEnv();

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
