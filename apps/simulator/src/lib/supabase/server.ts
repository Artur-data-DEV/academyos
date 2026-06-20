import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getEnv, getSupabasePublicKey } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export async function createClient() {
  const env = getEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }>,
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never),
            );
          } catch {
            // Em Server Components pode ocorrer tentativa de set em contexto read-only.
          }
        },
      },
    },
  );
}
