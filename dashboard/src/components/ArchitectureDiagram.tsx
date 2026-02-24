'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic,
  Brain,
  Sparkles,
  Volume2,
  GitBranch,
  Database,
  ChevronDown,
  Smartphone,
  MessageCircle,
  Phone,
  AppWindow,
  Shield,
  Wallet,
  ArrowLeftRight,
  Headphones,
  HelpCircle,
  HardDrive,
  Activity,
  Server,
  Eye,
  ArrowDown,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import architecture from '@/data/architecture.json'
import type { ArchitectureData } from '@/types'

const data: ArchitectureData = architecture as ArchitectureData

/* ------------------------------------------------------------------ */
/*  Constants & config                                                 */
/* ------------------------------------------------------------------ */

const CHANNEL_ITEMS = [
  { label: 'USSD', icon: Smartphone, color: 'from-amber-500 to-orange-600' },
  { label: 'WhatsApp', icon: MessageCircle, color: 'from-emerald-500 to-green-600' },
  { label: 'IVR', icon: Phone, color: 'from-sky-500 to-blue-600' },
  { label: 'Mobile App', icon: AppWindow, color: 'from-violet-500 to-purple-600' },
]

const PIPELINE_STAGES = [
  { label: 'ASR', sub: 'Speech-to-Text', icon: Mic, color: 'from-rose-500 to-pink-600' },
  { label: 'NLU', sub: 'Intent Classification', icon: Brain, color: 'from-amber-500 to-orange-600' },
  { label: 'LLM', sub: 'Agent + RAG', icon: Sparkles, color: 'from-sky-500 to-cyan-600' },
  { label: 'TTS', sub: 'Text-to-Speech', icon: Volume2, color: 'from-emerald-500 to-green-600' },
]

const CORE_SERVICES = [
  { label: 'Balance', icon: Wallet, color: 'from-emerald-500/80 to-emerald-700/80' },
  { label: 'Transfer', icon: ArrowLeftRight, color: 'from-sky-500/80 to-sky-700/80' },
  { label: 'Support', icon: Headphones, color: 'from-violet-500/80 to-violet-700/80' },
  { label: 'FAQ', icon: HelpCircle, color: 'from-amber-500/80 to-amber-700/80' },
]

const DATA_LAYER = [
  { label: 'PostgreSQL', icon: Database, color: 'from-blue-500/70 to-blue-700/70' },
  { label: 'Redis', icon: HardDrive, color: 'from-red-500/70 to-red-700/70' },
  { label: 'S3', icon: Server, color: 'from-orange-500/70 to-orange-700/70' },
  { label: 'Vector DB', icon: Activity, color: 'from-purple-500/70 to-purple-700/70' },
]

const COMPONENT_ICONS: Record<string, React.ElementType> = {
  'ASR Engine': Mic,
  'NLU / Intent Classification': Brain,
  'LLM Agent': Sparkles,
  'TTS Engine': Volume2,
  'Intent Router': GitBranch,
  'Vector DB': Database,
}

const COMPONENT_COLORS: Record<string, string> = {
  'ASR Engine': 'from-rose-500/20 to-pink-500/20 hover:from-rose-500/30 hover:to-pink-500/30',
  'NLU / Intent Classification': 'from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30',
  'LLM Agent': 'from-sky-500/20 to-cyan-500/20 hover:from-sky-500/30 hover:to-cyan-500/30',
  'TTS Engine': 'from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30',
  'Intent Router': 'from-violet-500/20 to-purple-500/20 hover:from-violet-500/30 hover:to-purple-500/30',
  'Vector DB': 'from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30',
}

const COMPONENT_ICON_COLORS: Record<string, string> = {
  'ASR Engine': 'text-rose-400',
  'NLU / Intent Classification': 'text-amber-400',
  'LLM Agent': 'text-sky-400',
  'TTS Engine': 'text-emerald-400',
  'Intent Router': 'text-violet-400',
  'Vector DB': 'text-blue-400',
}

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

/* ------------------------------------------------------------------ */
/*  Small reusable pieces                                              */
/* ------------------------------------------------------------------ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {children}
      </span>
      <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
    </div>
  )
}

function VerticalConnector() {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className="h-6 w-px bg-gradient-to-b from-muted-foreground/40 to-muted-foreground/20" />
      <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/40" />
    </div>
  )
}

function HorizontalArrow() {
  return (
    <div className="hidden items-center sm:flex">
      <div className="h-px w-4 bg-muted-foreground/30" />
      <ArrowRight className="h-3 w-3 -ml-0.5 text-muted-foreground/40" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Flow Diagram                                                       */
/* ------------------------------------------------------------------ */

function FlowDiagram() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={staggerContainer}
      className="relative rounded-2xl border border-border/60 bg-gradient-to-b from-card via-card to-card/80 p-6 sm:p-8 overflow-hidden"
    >
      {/* subtle background glow */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-[32rem] rounded-full bg-primary/[0.04] blur-3xl" />

      {/* Header */}
      <motion.div variants={fadeUp} custom={0} className="relative mb-8 text-center">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{data.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {data.description}
        </p>
      </motion.div>

      <div className="relative flex flex-col items-center">
        {/* ---- Customer Channels ---- */}
        <motion.div variants={fadeUp} custom={1} className="w-full">
          <SectionLabel>Customer Channels</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CHANNEL_ITEMS.map((ch) => (
              <motion.div
                key={ch.label}
                whileHover={{ y: -2, scale: 1.03 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                className="group relative flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 text-center shadow-sm"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br shadow-inner',
                    ch.color
                  )}
                >
                  <ch.icon className="h-5 w-5 text-white" />
                </div>
                <span className="text-xs font-semibold">{ch.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <VerticalConnector />

        {/* ---- API Gateway ---- */}
        <motion.div variants={fadeUp} custom={2} className="w-full max-w-xs">
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-3 shadow-sm backdrop-blur-sm">
            <Shield className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">API Gateway</span>
          </div>
        </motion.div>

        <VerticalConnector />

        {/* ---- Voice Pipeline ---- */}
        <motion.div variants={fadeUp} custom={3} className="w-full">
          <SectionLabel>Voice Pipeline</SectionLabel>
          <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-0">
            {PIPELINE_STAGES.map((stage, idx) => (
              <div key={stage.label} className="flex items-center">
                <motion.div
                  whileHover={{ y: -2, scale: 1.04 }}
                  transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                  className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm min-w-[140px]"
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br shadow-inner',
                      stage.color
                    )}
                  >
                    <stage.icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold leading-tight">{stage.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{stage.sub}</div>
                  </div>
                </motion.div>
                {idx < PIPELINE_STAGES.length - 1 && <HorizontalArrow />}
              </div>
            ))}
          </div>
        </motion.div>

        <VerticalConnector />

        {/* ---- Core Services ---- */}
        <motion.div variants={fadeUp} custom={4} className="w-full">
          <SectionLabel>Core Services</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CORE_SERVICES.map((svc) => (
              <motion.div
                key={svc.label}
                whileHover={{ y: -2, scale: 1.03 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br',
                    svc.color
                  )}
                >
                  <svc.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold">{svc.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <VerticalConnector />

        {/* ---- Data Layer ---- */}
        <motion.div variants={fadeUp} custom={5} className="w-full">
          <SectionLabel>Data Layer</SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DATA_LAYER.map((db) => (
              <motion.div
                key={db.label}
                whileHover={{ y: -2, scale: 1.03 }}
                transition={{ type: 'spring' as const, stiffness: 400, damping: 20 }}
                className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 shadow-sm"
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br',
                    db.color
                  )}
                >
                  <db.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold">{db.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ---- Observability sidebar ---- */}
        <motion.div
          variants={fadeUp}
          custom={6}
          className="absolute right-0 top-24 hidden xl:flex flex-col items-center gap-2 rounded-xl border border-border/40 bg-card/60 backdrop-blur-md px-3 py-4 shadow-sm"
        >
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground [writing-mode:vertical-lr]">
            Observability
          </span>
          <div className="mt-1 flex flex-col gap-1.5">
            {['Logs', 'Metrics', 'Traces'].map((t) => (
              <span
                key={t}
                className="rounded-md bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Component Cards                                                    */
/* ------------------------------------------------------------------ */

function ComponentCards() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={staggerContainer}
    >
      <motion.h3
        variants={fadeUp}
        custom={0}
        className="mb-4 text-lg font-bold tracking-tight"
      >
        Components
      </motion.h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.components.map((c, i) => {
          const Icon = COMPONENT_ICONS[c.name] ?? Database
          const gradient = COMPONENT_COLORS[c.name] ?? 'from-muted/30 to-muted/10'
          const iconColor = COMPONENT_ICON_COLORS[c.name] ?? 'text-muted-foreground'

          return (
            <motion.div
              key={c.name}
              variants={fadeUp}
              custom={i + 1}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
              className={cn(
                'group relative rounded-2xl border border-border/50 bg-gradient-to-br p-5 shadow-sm transition-colors duration-300',
                gradient
              )}
            >
              {/* hover gradient ring */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ring-1 ring-inset ring-white/10" />

              <div className="relative flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card/80 shadow-sm backdrop-blur-sm border border-border/40">
                  <Icon className={cn('h-5 w-5', iconColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold leading-tight">{c.name}</h4>
                  <Badge
                    variant="secondary"
                    className="mt-1.5 text-[10px] font-medium"
                  >
                    {c.tech}
                  </Badge>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {c.note}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Design Decisions Accordion                                         */
/* ------------------------------------------------------------------ */

function DesignDecisions() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={staggerContainer}
    >
      <motion.h3
        variants={fadeUp}
        custom={0}
        className="mb-4 text-lg font-bold tracking-tight"
      >
        Design Decisions
      </motion.h3>

      <div className="space-y-2">
        {data.design_decisions.map((d, i) => {
          const isOpen = open === i

          return (
            <motion.div
              key={d.decision}
              variants={fadeUp}
              custom={i + 1}
              className="relative overflow-hidden rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-sm"
            >
              {/* accent gradient bar */}
              <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />

              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/30"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold">{d.decision}</span>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                >
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-4 pl-16 text-sm leading-relaxed text-muted-foreground">
                      {d.rationale}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export default function ArchitectureDiagram() {
  return (
    <div className="space-y-10">
      <FlowDiagram />
      <ComponentCards />
      <DesignDecisions />
    </div>
  )
}
