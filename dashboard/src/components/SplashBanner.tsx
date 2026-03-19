'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, Mic, Globe, Rocket } from 'lucide-react'
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
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      requestAnimationFrame(() => setVisible(true))
    }
  }, [])

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
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, rgba(0, 180, 216, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, rgba(0, 229, 160, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 80%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              linear-gradient(135deg, #0a1628 0%, #0f2847 40%, #1a3a5c 70%, #0a1628 100%)
            `,
          }}
        >
          {/* Grain overlay */}
          <div
            className="pointer-events-none fixed inset-0 z-[101] opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />

          <div className="relative z-[102] mx-auto max-w-4xl px-6 py-16 text-center">
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="eyebrow mb-4 font-mono text-wave-cyan"
            >
              {meta.splash.role}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-12 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl"
            >
              <span className="bg-gradient-to-r from-wave-cyan via-wave-accent to-wave-cyan bg-clip-text text-transparent">
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
                    className="group rounded-xl border border-wave-cyan/10 bg-wave-navy/60 p-6 text-left backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-wave-cyan/30 hover:bg-wave-navy/80 hover:shadow-lg hover:shadow-wave-cyan/5"
                  >
                    <div className="mb-3 inline-flex rounded-lg bg-gradient-to-br from-wave-cyan to-wave-accent p-2">
                      <Icon className="h-5 w-5 text-wave-dark" />
                    </div>
                    <h3 className="mb-1 text-sm font-semibold text-wave-light">
                      {h.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-wave-muted">
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
              <button
                onClick={dismiss}
                className="btn-press glow-on-hover rounded-xl bg-gradient-to-r from-wave-cyan to-wave-accent px-8 py-3 text-sm font-semibold text-wave-dark shadow-lg shadow-wave-cyan/25 transition-all duration-300 hover:shadow-xl hover:shadow-wave-cyan/30"
              >
                {meta.splash.cta}
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
