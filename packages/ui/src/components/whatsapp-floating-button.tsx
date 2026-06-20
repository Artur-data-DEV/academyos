import { MessageCircle } from "lucide-react"

const normalizeWhatsappUrl = (): string | null => {
  const explicitUrl = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_URL?.trim()
  if (explicitUrl) {
    return explicitUrl
  }

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_PHONE?.replace(/\D/g, "")
  if (!phone) {
    return null
  }

  const message = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT_MESSAGE?.trim()
  const query = message ? `?text=${encodeURIComponent(message)}` : ""

  return `https://wa.me/${phone}${query}`
}

export function WhatsappFloatingButton() {
  const whatsappUrl = normalizeWhatsappUrl()

  if (!whatsappUrl) {
    return null
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar pelo WhatsApp"
      className="fixed bottom-14 right-4 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:ring-offset-2"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  )
}
