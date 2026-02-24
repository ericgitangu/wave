'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, X, Zap, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'wave-pwa-dismissed'
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Check cooldown
    const dismissedAt = localStorage.getItem(STORAGE_KEY)
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt)
      if (elapsed < DISMISS_COOLDOWN_MS) return
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent

      // Show prompt after 3-second delay
      setTimeout(() => {
        setVisible(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () =>
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt.current) return
    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    deferredPrompt.current = null
  }

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-border bg-background/90 p-4 shadow-2xl backdrop-blur-lg sm:left-auto sm:right-6 sm:w-[360px]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/20">
              <Download className="h-5 w-5 text-blue-400" />
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold">Install Wave Apply</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Get the full app experience
              </p>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  <WifiOff className="h-2.5 w-2.5" />
                  Works offline
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                  <Zap className="h-2.5 w-2.5" />
                  Faster & smoother
                </span>
              </div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleInstall}>
                  Install
                </Button>
                <Button variant="ghost" size="sm" onClick={dismiss}>
                  Not now
                </Button>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
