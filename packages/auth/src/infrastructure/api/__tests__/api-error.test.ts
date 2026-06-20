import { getApiErrorMessage } from "../api-error"

function axiosError(payload: {
  data?: unknown
  message?: string
  status?: number
}) {
  return {
    isAxiosError: true,
    message: payload.message ?? "Request failed",
    response: payload.status || payload.data
      ? {
          status: payload.status,
          data: payload.data,
        }
      : undefined,
  }
}

describe("getApiErrorMessage", () => {
  it("uses Laravel validation errors when no message is present", () => {
    const message = getApiErrorMessage(
      axiosError({
        data: {
          errors: {
            budget: ["O orçamento é obrigatório."],
          },
        },
      }),
      "Falha inesperada",
    )

    expect(message).toBe("O orçamento é obrigatório.")
  })

  it("uses custom status messages when the API does not send a message", () => {
    const message = getApiErrorMessage(
      axiosError({ status: 413 }),
      "Falha inesperada",
      {
        statusMessages: {
          413: "Arquivo muito grande.",
        },
      },
    )

    expect(message).toBe("Arquivo muito grande.")
  })

  it("uses custom network message for network failures", () => {
    const message = getApiErrorMessage(
      axiosError({ message: "Network Error" }),
      "Falha inesperada",
      {
        networkMessage: "Sem conexão.",
      },
    )

    expect(message).toBe("Sem conexão.")
  })

  it("falls back for non-error values", () => {
    expect(getApiErrorMessage(null, "Falha inesperada")).toBe("Falha inesperada")
  })
})
