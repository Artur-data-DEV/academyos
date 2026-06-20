import Link from "next/link";

import { signInAction, signInWithGoogleAction } from "@/app/actions/auth-actions";
import { BsGoogle } from "react-icons/bs";
import { CgGoogle } from "react-icons/cg";
import { FaGoogle } from "react-icons/fa";
import { SiGoogle } from "react-icons/si";
import { FcGoogle } from "react-icons/fc";

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  invalid_input: "Preencha email e senha corretamente.",
  invalid_credentials: "Email ou senha inválidos.",
  email_not_confirmed:
    "Email não confirmado. Verifique sua caixa de entrada ou desative a confirmação no Supabase Auth.",
  invalid_api_key:
    "Chave de API inválida. Verifique NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
  oauth_start_failed:
    "Não foi possível iniciar o login com Google. Tente novamente.",
  oauth_callback_failed:
    "Falha no retorno do Google. Tente entrar novamente.",
  signin_failed: "Não foi possível entrar agora. Tente novamente.",
};

const LOGIN_SUCCESS_MESSAGES: Record<string, string> = {
  signup_check_email:
    "Conta criada. Confira seu email para confirmar antes de entrar.",
  signup_success: "Conta criada. Você já pode entrar.",
};

type SearchParams = Promise<{
  error?: string;
  success?: string;
  error_code?: string;
  success_code?: string;
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const errorMessage =
    (params.error_code ? LOGIN_ERROR_MESSAGES[params.error_code] : undefined) ??
    params.error;
  const successMessage =
    (params.success_code
      ? LOGIN_SUCCESS_MESSAGES[params.success_code]
      : undefined) ?? params.success;

  return (
    <div className="rounded-3xl border border-[#444] bg-[#303031] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.35)]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#FFD369]">Entrar</h1>
        <p className="mt-1 text-sm text-[#D1D7DD]">
          Acesse sua jornada de estudo para o CSA.
        </p>
      </div>

      {errorMessage ? (
        <p className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      <form action={signInAction} className="space-y-4">
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
            required
            className="mt-1 w-full rounded-xl border border-[#555] bg-[#171819] px-3 py-2 text-sm text-[#F8F8F8] outline-none ring-[#FFD369] transition focus:ring"
            placeholder="********"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#FFD369] px-4 py-2.5 text-sm font-semibold text-[#171819] transition-colors hover:bg-[#EBB91B]"
        >
          Entrar
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
          className="flex flex-row items-center justify-center gap-2 w-full rounded-xl border border-[#555] bg-[#171819] px-4 py-2.5 text-sm font-semibold text-[#F8F8F8] transition-colors hover:border-[#FFD369] hover:bg-[#303031] hover:text-[#FFD369]"
        >
        <FcGoogle />  Entrar com Google 
        </button>
      </form>

      <p className="mt-4 text-sm text-[#D1D7DD]">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="font-medium text-[#FFD369] hover:text-[#EBB91B]">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
