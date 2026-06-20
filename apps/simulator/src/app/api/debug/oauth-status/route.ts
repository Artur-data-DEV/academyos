import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });

  try {
    // Tentar fazer o OAuth flow
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    return Response.json({
      success: !error,
      error: error?.message,
      redirectUrl: data?.url,
      config: {
        supabaseUrl,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
        callbackUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
      instructions: {
        step1: "Vá para https://console.cloud.google.com/apis/credentials",
        step2: "Clique em 'Cliente Web 1'",
        step3: "Verifique se em 'Authorized Redirect URIs' tem EXATAMENTE estas URIs:",
        requiredURIs: [
          "https://zlppqtksocqncaishbzh.supabase.co/auth/v1/callback",
          "https://csa-adaptive-simulator.vercel.app/auth/callback",
          "http://localhost:3000/auth/callback",
        ],
        fixSteps: [
          "1. Delete tudo de 'Authorized Redirect URIs'",
          "2. Adicione a primeira URI",
          "3. Clique no + para adicionar próxima",
          "4. Repita para as 3 URIs acima",
          "5. Clique 'Redefinir'",
          "6. Espere 5 minutos",
          "7. Teste de novo",
        ],
      },
    });
  } catch (err) {
    return Response.json({
      error: err instanceof Error ? err.message : "Erro desconhecido",
    }, { status: 500 });
  }
}
