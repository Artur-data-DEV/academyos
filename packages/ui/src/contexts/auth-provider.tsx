"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User } from "@/domain/entities/user"
import { ApiAuthRepository } from "@/infrastructure/repositories/auth-repository"
import { api } from "@/infrastructure/api/axios-adapter"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (token: string, user: User) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const authRepository = new ApiAuthRepository(api)
const DEV_PREVIEW_ROLE_KEY = "dev_preview_role"

const isPreviewRole = (value: string | null): value is User["role"] =>
  value === "admin" || value === "brand" || value === "creator" || value === "student"

const isLocalPreviewHost = () => {
  if (typeof window === "undefined") return false
  const host = window.location.hostname
  return host === "localhost" || host === "127.0.0.1"
}

const readPreviewRoleFromUrl = (): User["role"] | null => {
  if (!isLocalPreviewHost()) return null
  const params = new URLSearchParams(window.location.search)
  const previewRole = params.get("previewRole")

  if (previewRole === "off") {
    sessionStorage.removeItem(DEV_PREVIEW_ROLE_KEY)
    return null
  }

  if (isPreviewRole(previewRole)) {
    sessionStorage.setItem(DEV_PREVIEW_ROLE_KEY, previewRole)
    return previewRole
  }

  const storedRole = sessionStorage.getItem(DEV_PREVIEW_ROLE_KEY)
  return isPreviewRole(storedRole) ? storedRole : null
}

const buildPreviewUser = (role: User["role"]): User => {
  const now = new Date().toISOString()
  const roleLabel =
    role === "admin" ? "Admin" : role === "brand" ? "Marca" : role === "student" ? "Aluno" : "Criador"

  return {
    id: role === "admin" ? -1 : role === "brand" ? -2 : role === "student" ? -3 : -4,
    name: `Preview ${roleLabel}`,
    email: `preview.${role}@localhost`,
    role,
    created_at: now,
    updated_at: now,
    email_verified_at: now,
    is_premium_active: role === "creator" || role === "brand" ? true : undefined,
    has_premium: role === "creator" || role === "brand" ? true : undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const previewRole = readPreviewRoleFromUrl()
    if (previewRole) {
      setUser(buildPreviewUser(previewRole))
      setLoading(false)
      return
    }

    const token = sessionStorage.getItem("auth_token")
    if (!token) {
      setLoading(false)
      return
    }

    try {
      // Ensure CSRF cookie is set for stateful requests (if any)
      await authRepository.csrf()
      const userData = await authRepository.me()
      const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
      const nextUser = { ...userData, avatar: userData.avatar ? `${userData.avatar}${bust}` : userData.avatar }
      setUser(nextUser)
    } catch (error) {
      console.error("Failed to fetch user", error)
      sessionStorage.removeItem("auth_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (token: string, userData: User) => {
    if (isLocalPreviewHost()) {
      sessionStorage.removeItem(DEV_PREVIEW_ROLE_KEY)
    }
    sessionStorage.setItem("auth_token", token)
    try {
      await authRepository.csrf()
      const fresh = await authRepository.me()
      const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
      const nextUser = { ...fresh, avatar: fresh.avatar ? `${fresh.avatar}${bust}` : fresh.avatar }
      setUser(nextUser)
    } catch {
      const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
      const nextUser = { ...userData, avatar: userData.avatar ? `${userData.avatar}${bust}` : userData.avatar }
      setUser(nextUser)
    }
    // router.push("/dashboard")
  }

  const refreshUser = async () => {
    if (readPreviewRoleFromUrl()) {
      return
    }

    try {
      const userData = await authRepository.me()
      const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
      const nextUser = { ...userData, avatar: userData.avatar ? `${userData.avatar}${bust}` : userData.avatar }
      setUser(nextUser)
    } catch (error) {
      console.error("Failed to refresh user", error)
    }
  }

  const logout = async () => {
    try {
      await authRepository.logout()
    } catch (error) {
      console.error("Logout error", error)
    } finally {
      sessionStorage.removeItem("auth_token")
      if (isLocalPreviewHost()) {
        sessionStorage.removeItem(DEV_PREVIEW_ROLE_KEY)
      }
      setUser(null)
      router.push("/login")
    }
  }

  const updateUser = (userData: User) => {
    const bust = typeof window !== "undefined" ? `?t=${Date.now()}` : ""
    const nextUser = { ...userData, avatar: userData.avatar ? `${userData.avatar}${bust}` : userData.avatar }
    setUser(nextUser)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
