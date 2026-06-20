import { getGoogleOAuthUrl } from "../google-auth"
import { api } from "@/infrastructure/api/axios-adapter"

jest.mock("@/infrastructure/api/axios-adapter", () => {
  const real = jest.requireActual("@/infrastructure/api/axios-adapter")
  return {
    ...real,
    api: {
      get: jest.fn(),
      post: jest.fn(),
    },
  }
})

describe("google-auth API", () => {
  beforeEach(() => {
    ;(api.get as jest.Mock).mockReset()
  })

  it("retorna URL quando sucesso", async () => {
    ;(api.get as jest.Mock).mockResolvedValue({ success: true, redirect_url: "https://accounts.google.com/auth" })
    const url = await getGoogleOAuthUrl()
    expect(url).toContain("https://accounts.google.com")
  })

  it("lança erro quando não retorna redirect_url", async () => {
    ;(api.get as jest.Mock).mockResolvedValue({ success: false })
    await expect(getGoogleOAuthUrl()).rejects.toThrow()
  })
})
