'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Mic, Globe, Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'
import meta from '@/data/meta.json'
import type { SplashHighlight } from '@/types'

const STORAGE_KEY = 'wave-splash-dismissed'

const iconMap: Record<string, React.ElementType> = {
  brain: Brain,
  mic: Mic,
  globe: Globe,
  rocket: Rocket,
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function SplashBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return !sessionStorage.getItem(STORAGE_KEY)
  })

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  const highlights: SplashHighlight[] = meta.splash.highlights

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#312e81] overflow-y-auto"
        >
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4 text-sm font-medium tracking-widest uppercase text-blue-300"
            >
              {meta.splash.role}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-12 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
            >
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                {meta.splash.headline}
              </span>
            </motion.h1>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="mb-14 grid gap-4 sm:grid-cols-2"
            >
              {highlights.map((h) => {
                const Icon = iconMap[h.icon] ?? Brain
                return (
                  <motion.div
                    key={h.title}
                    variants={item}
                    className="group rounded-xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-md transition-colors hover:border-blue-400/30 hover:bg-white/10"
                  >
                    <Icon className="mb-3 h-6 w-6 text-blue-400" />
                    <h3 className="mb-1 text-sm font-semibold text-white">
                      {h.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {h.description}
                    </p>
                  </motion.div>
                )
              })}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <Button
                onClick={dismiss}
                size="lg"
                className="bg-blue-600 px-8 text-white hover:bg-blue-500"
              >
                {meta.splash.cta}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
