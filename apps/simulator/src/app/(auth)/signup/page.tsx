import Link from "next/link";

import { signInWithGoogleAction, signUpAction } from "@/app/actions/auth-actions";
import { FcGoogle } from "react-icons/fc";

const SIGNUP_ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Preencha email e senha corretamente.",
  user_already_exists: "Já existe uma conta com este email.",
  invalid_api_key:
    "Chave de API inválida. Verifique NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  email_rate_limited:
    "Muitas tentativas de cadastro no momento. Tente novamente em alguns minutos.",
  weak_password: "Senha inválida. Tente uma senha mais forte.",
  signup_failed: "Não foi possível criar a conta agora. Tente novamente.",
};

type SearchParams = Promise<{
  error?: string;
  error_code?: string;
}>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const errorMessage =
    (params.error_code ? SIGNUP_ERROR_MESSAGES[params.error_code] : undefined) ??
    params.error;

  return (
    <div className="rounded-3xl border border-[#444] bg-[#303031] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#FFD369]">Criar conta</h1>
        <p className="mt-1 text-sm text-[#D1D7DD]">
          Comece seus simulados adaptativos agora.
        </p>
      </div>

      {errorMessage ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <form action={signUpAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-[#F8F8F8]">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-xl border border-[#555] bg-[#171819] px-3 py-2 text-sm text-[#F8F8F8] outline-none ring-[#FFD369] transition focus:ring"
            placeholder="exemplo@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-[#F8F8F8]">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={6}
            required
            className="mt-1 w-full rounded-xl border border-[#555] bg-[#171819] px-3 py-2 text-sm text-[#F8F8F8] outline-none ring-[#FFD369] transition focus:ring"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#FFD369] px-4 py-2.5 text-sm font-semibold text-[#171819] transition-colors hover:bg-[#EBB91B]"
        >
          Criar conta
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#555]" />
        <span className="text-xs uppercase tracking-wide text-[#D1D7DD]">ou</span>
        <div className="h-px flex-1 bg-[#555]" />
      </div>

      <form action={signInWithGoogleAction}>
        <button
          type="submit"
          className="w-full flex flex-row items-center justify-center gap-2 rounded-xl border border-[#555] bg-[#171819] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] transition-colors hover:border-[#FFD369] hover:bg-[#303031] hover:text-[#FFD369]"
        >
          <FcGoogle />  Cadastrar com Google
        </button>
      </form>

      <p className="mt-4 text-sm text-[#D1D7DD]">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-[#FFD369] hover:text-[#EBB91B]">
          Fazer login
        </Link>
      </p>
    </div>
  );
}
