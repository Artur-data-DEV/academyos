"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { authSchema } from "@/lib/validation/auth";

function getRedirectWithParams(
  path: string,
  params: Record<string, string | undefined>,
) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function mapAuthErrorToCode(message: string, context: "signin" | "signup") {
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed")) {
    return "email_not_confirmed";
  }

  if (normalized.includes("invalid api key")) {
    return "invalid_api_key";
  }

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }

  if (normalized.includes("user already registered")) {
    return "user_already_exists";
  }

  if (
    normalized.includes("email rate limit exceeded") ||
    normalized.includes("over_email_send_rate_limit")
  ) {
    return "email_rate_limited";
  }

  if (normalized.includes("password")) {
    return "weak_password";
  }

  return context === "signin" ? "signin_failed" : "signup_failed";
}

function isEmailRateLimitError(error: { message: string; code?: string } | null) {
  if (!error) {
    return false;
  }

  return (
    error.code === "over_email_send_rate_limit" ||
    error.message.toLowerCase().includes("email rate limit exceeded")
  );
}

async function createUserWithServiceRole(email: string, password: string) {
  const env = getEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false as const, reason: "missing_service_role" };
  }

  const adminSupabase = createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const { error } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      email_verified: true,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { ok: false as const, reason: "already_exists" };
    }

    return { ok: false as const, reason: "create_failed" };
  }

  return { ok: true as const };
}

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isLocalHost(host: string) {
  return host.startsWith("localhost") || host.startsWith("127.0.0.1");
}

async function getSiteUrl() {
  const env = getEnv();

  if (env.NEXT_PUBLIC_SITE_URL) {
    return trimTrailingSlash(env.NEXT_PUBLIC_SITE_URL);
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return trimTrailingSlash(origin);
  }

  const forwardedHost = headerStore.get("x-forwarded-host");

  if (forwardedHost) {
    const forwardedProto = headerStore.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = headerStore.get("host");

  if (host) {
    const protocol = isLocalHost(host) ? "http" : "https";
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

export async function signInAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      getRedirectWithParams(
        "/login",
        {
          error_code: "invalid_input",
        },
      ),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(
      getRedirectWithParams("/login", {
        error_code: mapAuthErrorToCode(error.message, "signin"),
      }),
    );
  }

  redirect("/dashboard");
}

export async function signInWithGoogleAction() {
  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      queryParams: {
        prompt: "select_account",
      },
      skipBrowserRedirect: false,
    },
  });

  if (error || !data.url) {
    redirect(
      getRedirectWithParams("/login", {
        error_code: "oauth_start_failed",
      }),
    );
  }

  redirect(data.url);
}

export async function signUpAction(formData: FormData) {
  const parsed = authSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    redirect(
      getRedirectWithParams(
        "/signup",
        {
          error_code: "invalid_input",
        },
      ),
    );
  }

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();

  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    if (isEmailRateLimitError(error)) {
      const fallbackResult = await createUserWithServiceRole(
        parsed.data.email,
        parsed.data.password,
      );

      if (fallbackResult.ok) {
        redirect(
          getRedirectWithParams("/login", {
            success_code: "signup_success",
          }),
        );
      }

      if (fallbackResult.reason === "already_exists") {
        redirect(
          getRedirectWithParams("/signup", {
            error_code: "user_already_exists",
          }),
        );
      }

      redirect(
        getRedirectWithParams("/signup", {
          error_code: "email_rate_limited",
        }),
      );
    }

    redirect(
      getRedirectWithParams("/signup", {
        error_code: mapAuthErrorToCode(error.message, "signup"),
      }),
    );
  }

  if (!data.session) {
    redirect(
      getRedirectWithParams(
        "/login",
        {
          success_code: "signup_check_email",
        },
      ),
    );
  }

  redirect(
    getRedirectWithParams("/login", {
      success_code: "signup_success",
    }),
  );
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
