"use client"

import { useEffect, useState } from "react"
import { Bell, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Button } from "@/presentation/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/presentation/components/ui/dropdown-menu"
import { ScrollArea } from "@/presentation/components/ui/scroll-area"
import { useNotifications } from "@/presentation/contexts/notification-provider"
import { useAuth } from "@/presentation/contexts/auth-provider"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function NotificationBell() {
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    isLoading 
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    if (isOpen) {
        void fetchNotifications(1)
    }
  }, [fetchNotifications, isOpen])

  const handleNotificationClick = (id: number, isRead: boolean) => {
    const notification = notifications.find(n => n.id === id)
    if (!notification) return

    const data = notification.data || {}
    const roomId =
      (typeof data.chat_room_id === "string" && data.chat_room_id) ||
      (typeof data.roomId === "string" && data.roomId)
    const campaignId =
      (typeof data.campaign_id === "number" && String(data.campaign_id)) ||
      (typeof data.campaign_id === "string" && data.campaign_id)

    if (roomId) {
      if (typeof window !== "undefined") {
        const userId = user?.id ? String(user.id) : "anon"
        localStorage.setItem(`last_selected_room_id_user_${userId}`, roomId)
      }
      router.push("/dashboard/messages")
      setIsOpen(false)
    } else if (campaignId) {
      router.push(`/dashboard/campaigns/${campaignId}`)
      setIsOpen(false)
    } else if (notification.type === "profile_approved") {
      router.push("/dashboard/profile")
      setIsOpen(false)
    } else if (
      notification.type === "student_verification_approved" ||
      notification.type === "student_verification_rejected"
    ) {
      router.push("/dashboard/student-verify")
      setIsOpen(false)
    }

    if (!isRead) {
      markAsRead(id)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 sm:w-96">
        <div className="flex items-center justify-between px-4 py-2">
            <span className="font-semibold">Notificações</span>
            {unreadCount > 0 && (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto px-2 text-xs text-muted-foreground hover:text-primary"
                    onClick={() => markAllAsRead()}
                >
                    Marcar todas como lidas
                </Button>
            )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-100">
            {isLoading && notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                    Carregando...
                </div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <Bell className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm">Nenhuma notificação</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {notifications.map((notification) => (
                        <div 
                            key={notification.id}
                            className={cn(
                                "flex flex-col gap-1 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/50",
                                !notification.is_read && "bg-muted/20"
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div 
                                    className="flex-1 cursor-pointer"
                                    onClick={() => handleNotificationClick(notification.id, notification.is_read)}
                                >
                                    <p className={cn("font-medium", !notification.is_read && "text-primary")}>
                                        {notification.title}
                                    </p>
                                    <p className="text-muted-foreground line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground/60">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                            addSuffix: true,
                                            locale: ptBR,
                                        })}
                                    </p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    {!notification.is_read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                                            onClick={() => markAsRead(notification.id)}
                                            title="Marcar como lida"
                                        >
                                            <span className="h-2 w-2 rounded-full bg-primary" />
                                            <span className="sr-only">Marcar como lida</span>
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteNotification(notification.id)}
                                        title="Remover"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        <span className="sr-only">Remover</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Add load more button if needed */}
                </div>
            )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
