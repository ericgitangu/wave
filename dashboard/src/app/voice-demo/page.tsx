'use client'

import { motion } from 'framer-motion'
import { Mic, Globe, Brain, Zap } from 'lucide-react'
import VoiceAgent from '@/components/VoiceAgent'

const FEATURES = [
  {
    icon: Globe,
    title: '3 Languages',
    description: 'French (Wolof market), Swahili (East Africa), English',
    color: 'from-blue-500/15 to-indigo-500/15',
    iconColor: 'text-blue-400',
  },
  {
    icon: Brain,
    title: 'Intent Classification',
    description: 'Rust tokenizer classifies balance, transfer, account, help, greeting',
    color: 'from-purple-500/15 to-violet-500/15',
    iconColor: 'text-purple-400',
  },
  {
    icon: Mic,
    title: 'Web Speech API',
    description: 'Real browser speech-to-text with fallback text input',
    color: 'from-rose-500/15 to-pink-500/15',
    iconColor: 'text-rose-400',
  },
  {
    icon: Zap,
    title: 'Sub-100ms Latency',
    description: 'Rust-speed classification with encrypted API responses',
    color: 'from-amber-500/15 to-orange-500/15',
    iconColor: 'text-amber-400',
  },
]

const COMMANDS = [
  {
    lang: 'French',
    flag: '🇫🇷',
    currency: 'XOF',
    gradient: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20',
    items: ['Consulter mon solde', "Envoyer de l'argent", 'Informations du compte', 'Aidez-moi', 'Bonjour'],
  },
  {
    lang: 'Swahili',
    flag: '🇰🇪',
    currency: 'KES',
    gradient: 'from-emerald-500/10 to-green-500/10 border-emerald-500/20',
    items: ['Angalia salio langu', 'Tuma pesa', 'Akaunti yangu', 'Nisaidie', 'Habari'],
  },
  {
    lang: 'English',
    flag: '🇬🇧',
    currency: 'KES',
    gradient: 'from-purple-500/10 to-violet-500/10 border-purple-500/20',
    items: ['Check my balance', 'Send money to John', 'Show my account info', 'Help me', 'Hello'],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

export default function VoiceDemoPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/20">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Afri-Voice Demo
            </h1>
            <p className="text-sm text-muted-foreground">
              Multilingual voice agent for mobile money operations
            </p>
          </div>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          A prototype demonstrating how Wave&apos;s voice pipeline could classify customer intents
          across French, Swahili, and English — serving 10M+ users across West and East Africa.
        </p>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            custom={i}
            className={`group rounded-xl border border-border/50 bg-gradient-to-br ${f.color} p-4 transition-colors hover:border-white/10`}
          >
            <f.icon className={`mb-2 h-5 w-5 ${f.iconColor}`} />
            <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{f.description}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Voice Agent */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <VoiceAgent />
      </motion.div>

      {/* Supported Commands */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
            Supported Commands
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {COMMANDS.map((cmd) => (
            <div
              key={cmd.lang}
              className={`rounded-xl border bg-gradient-to-br ${cmd.gradient} p-5`}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <span className="text-lg">{cmd.flag}</span>
                  {cmd.lang}
                </h3>
                <span className="rounded-md bg-card/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {cmd.currency}
                </span>
              </div>
              <ul className="space-y-1.5">
                {cmd.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                    &ldquo;{item}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Architecture note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-border/40 bg-card/40 p-5"
      >
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
          How It Works
        </h3>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {[
            'Browser Speech API captures audio',
            'Text sent to /api/voice endpoint',
            'Rust tokenizer classifies language + intent',
            'Response generated per language/currency',
            'Encrypted payload returned to client',
          ].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-[10px] font-bold text-blue-400">
                {i + 1}
              </span>
              <span>{step}</span>
              {i < 4 && <span className="hidden text-muted-foreground/30 sm:inline">→</span>}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
