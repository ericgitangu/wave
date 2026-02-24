'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Brain, Zap, Shield } from 'lucide-react'

const CURRENT_VERSION = '0.4.0'
const STORAGE_KEY = 'wave-whats-new-seen'

interface ChangeEntry {
  version: string
  date: string
  icon: React.ReactNode
  title: string
  items: string[]
}

const changelog: ChangeEntry[] = [
  {
    version: '0.4.0',
    date: '2026-02-24',
    icon: <Shield className="h-4 w-4 text-emerald-400" />,
    title: 'Provisioning, Footer & Polish',
    items: [
      'Auto-start/stop provisioning gate (59min cap)',
      'Professional footer with vCard, LinkedIn, GitHub, resume links',
      'Submission status explainer with Wave\'s exact instructions',
      'Markdown rendering in chat responses',
      'Jakarta Sans font, profile image on homepage',
    ],
  },
  {
    version: '0.3.0',
    date: '2026-02-23',
    icon: <Brain className="h-4 w-4 text-purple-400" />,
    title: 'ML Pipeline & Real Health Probes',
    items: [
      'Bedrock Claude Haiku sentiment analysis',
      'Titan Embeddings V2 semantic search',
      'SageMaker XLM-RoBERTa 20-language detection',
      'Docker Lambda builds with compiled Rust+PyO3',
      'Real AWS health probes on system status page',
    ],
  },
  {
    version: '0.2.0',
    date: '2026-02-22',
    icon: <Zap className="h-4 w-4 text-amber-400" />,
    title: 'Voice Demo & Dashboard UI',
    items: [
      'Afri-Voice multilingual agent (French/Swahili/English)',
      'Alignment matrix with gradient cards & modal detail view',
      'Architecture page with visual pipeline diagram',
      'CDK stacks: DynamoDB, EventBridge, API Gateway',
    ],
  },
  {
    version: '0.1.0',
    date: '2026-02-21',
    icon: <Sparkles className="h-4 w-4 text-blue-400" />,
    title: 'Initial Release',
    items: [
      'Monorepo: Rust+PyO3 backend, Next.js PWA dashboard, CDK infra',
      'Encrypted submission pipeline with Bearer token auth',
      'Rust voice classification module',
      'System status page with polling',
    ],
  },
]

export default function WhatsNew() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (seen !== CURRENT_VERSION) {
      const timer = setTimeout(() => setVisible(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION)
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl sm:inset-x-auto"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-bold text-foreground">What&apos;s New</h2>
                <span className="rounded bg-accent px-2 py-0.5 text-xs font-mono text-accent-foreground">
                  v{CURRENT_VERSION}
                </span>
              </div>
              <button
                onClick={dismiss}
                className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              {changelog.map((entry, i) => (
                <div key={entry.version} className="relative pl-6">
                  {/* Timeline */}
                  {i < changelog.length - 1 && (
                    <div className="absolute left-[7px] top-6 bottom-0 w-px bg-border" />
                  )}
                  <div className="absolute left-0 top-1 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-border bg-card">
                    <div className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`} />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-mono font-medium text-accent-foreground">
                        v{entry.version}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{entry.date}</span>
                      {entry.icon}
                    </div>
                    <p className="text-sm font-medium text-foreground">{entry.title}</p>
                    <ul className="space-y-0.5">
                      {entry.items.map((item) => (
                        <li key={item} className="text-xs text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={dismiss}
              className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Got it
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
