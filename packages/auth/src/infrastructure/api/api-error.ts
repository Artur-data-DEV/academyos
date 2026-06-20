import { isAxiosError } from "axios"

type ApiErrorPayload = {
  message?: string
  error?: string
  errors?: Record<string, string | string[]>
}

type ApiErrorMessageOptions = {
  networkMessage?: string
  statusMessages?: Record<number, string>
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  options: ApiErrorMessageOptions = {},
): string {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const data = error.response?.data
    const statusMessage = error.response?.status
      ? options.statusMessages?.[error.response.status]
      : undefined
    const validationMessage = data?.errors
      ? Object.values(data.errors).flat().find((message) => message.trim().length > 0)
      : undefined

    if (error.message === "Network Error" && options.networkMessage) {
      return options.networkMessage
    }

    return data?.message || data?.error || validationMessage || statusMessage || error.message || fallback
  }

  if (error instanceof Error) {
    if (error.message === "Network Error" && options.networkMessage) {
      return options.networkMessage
    }

    return error.message || fallback
  }

  return fallback
}
