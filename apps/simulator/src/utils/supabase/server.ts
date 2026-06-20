import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getEnv, getSupabasePublicKey } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export const createClient = (
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) => {
  const env = getEnv();

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
            // Ignorado em Server Components; o middleware renova sessao.
          }
        },
      },
    },
  );
};
