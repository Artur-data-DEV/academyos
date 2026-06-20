import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { headers } from "next/headers";

export async function GET() {
  const env = getEnv();
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");

  const callbackUrl = env.NEXT_PUBLIC_SITE_URL 
    ? `${env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : `http://localhost:3000/auth/callback`;

  return NextResponse.json({
    config: {
      NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "✅ Configurado" : "❌ Faltando",
      NEXT_PUBLIC_SITE_URL: env.NEXT_PUBLIC_SITE_URL,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Configurado" : "❌ Faltando",
      expectedCallbackUrl: callbackUrl,
    },
    requestHeaders: {
      origin,
      host,
    },
    googleOAuthChecklist: {
      step1: "Vá para https://console.cloud.google.com/apis/credentials",
      step2: "Procure sua credencial OAuth 2.0 (tipo: Web application)",
      step3: "Verifique se o 'Authorized redirect URIs' contém:",
      redirectUrisNeeded: [
        `${callbackUrl}`,
        "http://localhost:3000/auth/callback",
      ],
      step4: "Copie Client ID e Client Secret",
      step5: "Vá para https://app.supabase.com > Authentication > Providers > Google",
      step6: "Cole Client ID e Client Secret lá",
      step7: "Clique 'Save'",
      troubleshooting: {
        issue: "Unable to exchange external code",
        cause1: "Redirect URI no Google não contém: " + callbackUrl,
        cause2: "Client ID ou Client Secret inválidos/expirados no Supabase",
        cause3: "Projeto Google Cloud desativado ou sem quota",
      },
    },
  });
}

