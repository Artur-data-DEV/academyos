import { createBrowserClient } from "@supabase/ssr";

import { getEnv, getSupabasePublicKey } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export function createClient() {
  const env = getEnv();

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    getSupabasePublicKey(),
  );
}
