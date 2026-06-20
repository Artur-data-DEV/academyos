import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios"

export interface HttpClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
  post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>
  put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>
  patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T>
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}

type PreviewRole = "admin" | "brand" | "creator" | "student"

export class AxiosAdapter implements HttpClient {
  private api: AxiosInstance

  constructor(baseURL: string) {
    this.api = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      withCredentials: true, // Necessary for Laravel Sanctum
      timeout: 60000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        const headers = config.headers as Record<string, unknown> | undefined
        const skipAuth = headers?.["X-Skip-Auth"] === "true"
        const token = typeof window !== "undefined" ? sessionStorage.getItem("auth_token") : null
        if (!skipAuth && token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        if (config.data instanceof FormData && headers) {
          delete headers["Content-Type"]
        }

        // Add Socket ID for broadcasting toOthers()
        const echo = typeof window !== "undefined"
          ? (window as unknown as { Echo?: { socketId?: () => string } }).Echo
          : undefined
        if (!skipAuth && echo) {
          const socketId = echo.socketId?.()
          if (socketId) {
            config.headers["X-Socket-Id"] = socketId
          }
        }

        if (skipAuth && headers) {
          delete headers["X-Skip-Auth"]
          if (headers["Authorization"]) {
            delete headers["Authorization"]
          }
        }

        return config
      },
      (error) => Promise.reject(error)
    )

    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          if (typeof window !== "undefined") {
            const isLocalPreviewHost =
              window.location.hostname === "localhost" ||
              window.location.hostname === "127.0.0.1"
            const previewRole = sessionStorage.getItem("dev_preview_role")
            const isLocalPreviewSession = isLocalPreviewHost && !!previewRole

            if (isLocalPreviewSession) {
              return Promise.reject(error)
            }

            sessionStorage.removeItem("auth_token")
            window.location.href = "/login"
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private getPreviewRole(): PreviewRole | null {
    if (typeof window === "undefined") return null

    const host = window.location.hostname
    const isLocalHost = host === "localhost" || host === "127.0.0.1"
    if (!isLocalHost) return null

    const previewRole = sessionStorage.getItem("dev_preview_role")
    if (
      previewRole === "admin" ||
      previewRole === "brand" ||
      previewRole === "creator" ||
      previewRole === "student"
    ) {
      return previewRole
    }

    return null
  }

  private getPreviewMockResponse<T>(method: "get" | "post" | "put" | "patch" | "delete", url: string): T | undefined {
    const previewRole = this.getPreviewRole()
    if (!previewRole) return undefined

    const path = url.split("?")[0]
    const now = new Date()
    const nowIso = now.toISOString()
    const futureIso = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30).toISOString()
    const pagination = {
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 2,
    }

    if (previewRole === "admin" && path.startsWith("/admin")) {
      if (method === "get" && path === "/admin/users/statistics") {
        return {
          success: true,
          data: {
            total_users: 24,
            total_creators: 12,
            total_brands: 7,
            active_users: 21,
            blocked_users: 3,
            pending_verification: 2,
          },
        } as T
      }

      if (method === "get" && path === "/admin/users") {
        return {
          success: true,
          data: [
            {
              id: 901,
              name: "Preview Creator",
              email: "creator.preview@local",
              role: "creator",
              is_active: true,
              email_verified_at: nowIso,
              created_at: nowIso,
              account_status: "Ativo",
              time_on_platform: "30 dias",
              has_premium: true,
              student_verified: false,
              is_premium_active: true,
              is_student_active: false,
              is_trial_active: false,
              premium_expires_at: futureIso,
              free_trial_expires_at: null,
              student_initial_expires_at: null,
              student_expires_at: null,
              effective_access_source: "premium",
              effective_access_expires_at: futureIso,
            },
            {
              id: 902,
              name: "Preview Brand",
              email: "brand.preview@local",
              role: "brand",
              is_active: true,
              email_verified_at: nowIso,
              created_at: nowIso,
              account_status: "Ativo",
              time_on_platform: "20 dias",
              has_premium: false,
              student_verified: false,
              is_premium_active: false,
              is_student_active: false,
              is_trial_active: false,
              premium_expires_at: null,
              free_trial_expires_at: null,
              student_initial_expires_at: null,
              student_expires_at: null,
              effective_access_source: "none",
              effective_access_expires_at: null,
            },
          ],
          pagination,
        } as T
      }

      if (method === "get" && path === "/admin/students") {
        return {
          success: true,
          data: [
            {
              id: 903,
              name: "Preview Student",
              email: "student.preview@local",
              is_active: true,
              email_verified_at: nowIso,
              institution_name: "Universidade Local",
              course_name: "Build Creators",
              created_at: nowIso,
              status: "active",
              trial_status: "active",
              days_remaining: 24,
              has_premium: false,
              is_premium_active: false,
              is_student_initial_active: true,
              effective_access_source: "student",
              effective_access_expires_at: futureIso,
            },
          ],
          pagination: {
            ...pagination,
            total: 1,
          },
        } as T
      }

      if (method === "get" && path === "/admin/campaigns") {
        return {
          success: true,
          data: [
            {
              id: 401,
              title: "Campanha Preview Mobile",
              description: "Campanha simulada para validar layout mobile.",
              status: "pending",
              budget: 350,
              campaign_type: "UGC",
              brand: { id: 1, name: "Nexa", company_name: "Nexa" },
              created_at: nowIso,
              start_date: nowIso,
              end_date: futureIso,
              has_open_text_suggestion: false,
            },
            {
              id: 402,
              title: "Campanha Preview 2",
              description: "Segundo item simulado.",
              status: "approved",
              budget: 500,
              campaign_type: "Vídeo",
              brand: { id: 2, name: "Leg Gym", company_name: "Leg Gym" },
              created_at: nowIso,
              start_date: nowIso,
              end_date: futureIso,
              has_open_text_suggestion: true,
            },
          ],
          pagination,
        } as T
      }

      if (method === "get" && path === "/admin/student-requests") {
        return {
          success: true,
          data: [
            {
              id: 501,
              user_id: 903,
              user_name: "Preview Student",
              user_email: "student.preview@local",
              purchase_email: "student.preview@local",
              institution_name: "Universidade Local",
              course_name: "Build Creators",
              status: "pending",
              created_at: nowIso,
            },
          ],
        } as T
      }

      if (method === "get" && path === "/admin/payouts/verification-report") {
        return {
          success: true,
          data: {
            summary: {
              total_withdrawals: 2,
              total_amount: 840,
              verification_passed: 1,
              verification_failed: 0,
              pending_verification: 1,
            },
            withdrawals: [
              {
                id: 601,
                amount: "R$ 420,00",
                withdrawal_method: "pix",
                status: "pending",
                transaction_id: null,
                processed_at: null,
                creator: {
                  id: 901,
                  name: "Preview Creator",
                  email: "creator.preview@local",
                },
                verification_status: "pending",
                bank_details_match: true,
                amount_verification: true,
              },
            ],
            pagination: {
              ...pagination,
              total: 1,
            },
          },
        } as T
      }

      if (method === "get" && /^\/admin\/payouts\/\d+\/verify$/.test(path)) {
        return {
          success: true,
          data: {
            withdrawal: {
              id: 601,
              amount: "R$ 420,00",
              withdrawal_method: "pix",
              status: "pending",
              transaction_id: null,
              processed_at: null,
              created_at: nowIso,
              withdrawal_details: {},
            },
            creator: {
              id: 901,
              name: "Preview Creator",
              email: "creator.preview@local",
            },
            bank_account_verification: {
              withdrawal_bank_details: null,
              current_bank_account: null,
              details_match: true,
            },
            verification_summary: {
              withdrawal_amount_correct: true,
              bank_details_consistent: true,
              transaction_id_valid: false,
              processing_time_reasonable: true,
              overall_verification_status: "pending",
            },
          },
        } as T
      }

      if (method === "get" && path === "/admin/guides") {
        return {
          success: true,
          data: [
            {
              id: 701,
              title: "Guia Preview",
              description: "Guia simulado para revisão de layout.",
              role: "creator",
              audience: "Creator",
              media_type: "image",
              media_url: "",
              order: 1,
              is_active: true,
              created_at: nowIso,
              steps: [
                {
                  id: 1,
                  title: "Abra o painel",
                  description: "Acesse o menu principal e selecione a area desejada.",
                  order: 0,
                  video_path: null,
                },
              ],
              video_path: null,
              updated_at: nowIso,
            },
          ],
        } as T
      }

      if (method === "get" && path === "/admin/dashboard-metrics") {
        return {
          success: true,
          data: {
            pendingCampaignsCount: 3,
            allActiveCampaignCount: 14,
            allRejectCampaignCount: 1,
            allUserCount: 24,
          },
        } as T
      }

      if (method === "get" && path === "/admin/recent-users") {
        return {
          success: true,
          data: [
            { id: 901, name: "Preview Creator", role: "creator", created_at: nowIso, registeredDaysAgo: 1 },
            { id: 902, name: "Preview Brand", role: "brand", created_at: nowIso, registeredDaysAgo: 2 },
          ],
        } as T
      }

      if (method === "get" && path === "/admin/pending-campaigns") {
        return {
          success: true,
          data: [
            { id: 401, title: "Campanha Preview Mobile", brand: "Nexa", type: "UGC", budget: 350 },
          ],
        } as T
      }

      if (method === "get" && path === "/admin/brand-rankings") {
        return {
          success: true,
          data: {
            mostInvested: [
              {
                brand_id: 1,
                company_name: "Nexa",
                total_invested: 15200,
                campaigns_count: 12,
              },
            ],
            mostPosted: [
              {
                brand_id: 1,
                company_name: "Nexa",
                campaigns_count: 12,
                total_invested: 15200,
              },
            ],
          },
        } as T
      }

      if (method === "get" && path === "/admin/brand-rankings/comprehensive") {
        return {
          success: true,
          data: [
            {
              brand_id: 1,
              company_name: "Nexa",
              total_invested: 15200,
              campaigns_count: 12,
            },
          ],
        } as T
      }

      if (method !== "get") {
        return {
          success: true,
          message: "Ação simulada em modo preview local.",
        } as T
      }

      return {
        success: true,
        data: [],
        pagination: {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 0,
        },
      } as T
    }

    return undefined
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const previewMock = this.getPreviewMockResponse<T>("get", url)
    if (previewMock !== undefined) {
      return Promise.resolve(previewMock)
    }

    const response: AxiosResponse<T> = await this.api.get(url, config)
    return response.data
  }

  async post<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const previewMock = this.getPreviewMockResponse<T>("post", url)
    if (previewMock !== undefined) {
      return Promise.resolve(previewMock)
    }

    const response: AxiosResponse<T> = await this.api.post(url, data, config)
    return response.data
  }

  async put<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const previewMock = this.getPreviewMockResponse<T>("put", url)
    if (previewMock !== undefined) {
      return Promise.resolve(previewMock)
    }

    const response: AxiosResponse<T> = await this.api.put(url, data, config)
    return response.data
  }

  async patch<T, D = unknown>(url: string, data?: D, config?: AxiosRequestConfig): Promise<T> {
    const previewMock = this.getPreviewMockResponse<T>("patch", url)
    if (previewMock !== undefined) {
      return Promise.resolve(previewMock)
    }

    const response: AxiosResponse<T> = await this.api.patch(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const previewMock = this.getPreviewMockResponse<T>("delete", url)
    if (previewMock !== undefined) {
      return Promise.resolve(previewMock)
    }

    const response: AxiosResponse<T> = await this.api.delete(url, config)
    return response.data
  }
}

function computeBaseURL(): string {
  const env = process.env.NEXT_PUBLIC_BACKEND_URL
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  if (origin && origin.includes("nexacreators.com")) {
    return `${origin}/api`
  }
  if (env && env.length > 0) {
    return env
  }
  if (origin && origin.endsWith(".run.app")) {
    return "https://nexa-backend-prod-1044548850970.southamerica-east1.run.app/api"
  }
  return "https://nexa-backend-prod-1044548850970.southamerica-east1.run.app/api"
}

export const api = new AxiosAdapter(computeBaseURL())
