import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getEnv } from "@/lib/env";

function getSafeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Log de debug
  console.log("[Auth Callback] Recebido:", {
    code: code ? "✅ Sim" : "❌ Não",
    error,
    errorDescription,
    nextPath,
    requestUrl: requestUrl.href,
  });

  // Se houver erro do Google
  if (error) {
    const env = getEnv();
    const loginUrl = new URL("/login", env.NEXT_PUBLIC_SITE_URL || requestUrl.origin);
    loginUrl.searchParams.set("error_code", "oauth_callback_failed");
    loginUrl.searchParams.set("error", `Erro do Google: ${errorDescription || error}`);
    console.log("[Auth Callback] Erro do Google, redirecionando para:", loginUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const env = getEnv();
    const loginUrl = new URL("/login", env.NEXT_PUBLIC_SITE_URL || requestUrl.origin);
    loginUrl.searchParams.set("error_code", "oauth_callback_failed");
    loginUrl.searchParams.set("error", "Nenhum código recebido do Google");
    console.log("[Auth Callback] Sem código, redirecionando para:", loginUrl.href);
    return NextResponse.redirect(loginUrl);
  }

  try {
    console.log("[Auth Callback] Criando cliente Supabase...");
    const supabase = await createClient();
    
    console.log("[Auth Callback] Trocando código por sessão...");
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[Auth Callback] Erro ao trocar código:", {
        message: exchangeError.message,
        status: exchangeError.status,
        code,
      });
      
      const env = getEnv();
      const loginUrl = new URL("/login", env.NEXT_PUBLIC_SITE_URL || requestUrl.origin);
      loginUrl.searchParams.set("error_code", "oauth_callback_failed");
      loginUrl.searchParams.set("error", `Erro Supabase: ${exchangeError.message}`);
      return NextResponse.redirect(loginUrl);
    }

    console.log("[Auth Callback] ✅ Sessão criada com sucesso!", {
      user: data.user?.email,
    });

    const env = getEnv();
    const successUrl = new URL(nextPath, env.NEXT_PUBLIC_SITE_URL || requestUrl.origin);
    console.log("[Auth Callback] Redirecionando para:", successUrl.href);
    return NextResponse.redirect(successUrl);
  } catch (err) {
    console.error("[Auth Callback] Exceção:", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    const env = getEnv();
    const loginUrl = new URL("/login", env.NEXT_PUBLIC_SITE_URL || requestUrl.origin);
    loginUrl.searchParams.set("error_code", "oauth_callback_failed");
    loginUrl.searchParams.set("error", "Erro ao processar callback");
    return NextResponse.redirect(loginUrl);
  }
}



