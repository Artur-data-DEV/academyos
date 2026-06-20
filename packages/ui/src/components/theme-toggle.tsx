"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

import { Button } from "@/presentation/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Avoid overlaying fixed chat controls in the messages route.
  if (pathname?.startsWith("/dashboard/messages")) {
    return null
  }

  return (
    <div className="fixed bottom-1 right-1 z-100">
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border-border hover:bg-background/90 shadow-lg transition-all hover:scale-105 active:scale-95 group"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <AnimatePresence mode="wait" initial={false}>
          {theme === "dark" ? (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="h-[1.1rem] w-[1.1rem] text-primary group-hover:text-primary/80" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="h-[1.1rem] w-[1.1rem] text-orange-500 group-hover:text-orange-600" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  )
}
