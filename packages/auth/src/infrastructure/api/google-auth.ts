"use client"

import { api } from "./axios-adapter"
import { AuthResponse } from "@/domain/entities/user"

export async function getGoogleOAuthUrl() {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://www.nexacreators.com/api"
  const rootUrl = backendUrl.replace(/\/api\/?$/, "")
  if (!backendUrl) {
    throw new Error("BACKEND_URL não configurado")
  }
  try {
    const response = await api.get<{ success: boolean; redirect_url?: string; message?: string }>("/google/redirect", {
      baseURL: `${rootUrl}/api`,
    })
    if (!response?.success || typeof response.redirect_url !== "string" || response.redirect_url.length === 0) {
      throw new Error(response?.message || "Falha ao obter URL do Google OAuth")
    }
    return response.redirect_url
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Falha ao iniciar Google OAuth"
    throw new Error(message)
  }
}

export type GoogleAuthResponse = AuthResponse & {
    success: boolean
    message?: string
    action?: 'role_selection'
    registration_id?: string
    google_user?: {
        name: string
        email: string
        avatar: string
    }
    is_new_user?: boolean
}

export async function handleGoogleCallbackRequest(code: string, role?: "creator" | "brand", isStudent?: boolean) {
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "https://www.nexacreators.com/api"
  const rootUrl = backendUrl.replace(/\/api\/?$/, "")

  const params = new URLSearchParams({ code })

  if (role) {
    params.append("role", role)
  }

  if (isStudent) {
    params.append("is_student", "true")
  }

  const response = await api.get<GoogleAuthResponse>(`/google/callback?${params.toString()}`, {
    baseURL: `${rootUrl}/api`,
  })

  if (response.success && response.action === 'role_selection') {
      return response
  }

  if (!response?.success || !response?.token || !response?.user) {
    throw new Error(response.message || "Falha na autenticação com Google")
  }

  return response
}

export async function completeGoogleRegistration(registrationId: string, role: "creator" | "brand", whatsapp: string) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "https://www.nexacreators.com/api"
  const rootUrl = backendUrl.replace(/\/api\/?$/, "")

  const response = await api.post<AuthResponse & { success: boolean }>(`/google/complete-registration`, {
      registration_id: registrationId,
      role,
      whatsapp
  }, {
      baseURL: `${rootUrl}/api`
  })
  
  return response
}
