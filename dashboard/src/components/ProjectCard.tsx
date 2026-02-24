'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ExternalLink,
  GitBranch,
  X,
  Wallet,
  Brain,
  Mic,
  Code2,
  Cpu,
  Sun,
  BookOpen,
  Layers,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'

/* ------------------------------------------------------------------ */
/*  Color & icon mapping by project category                           */
/* ------------------------------------------------------------------ */

const PROJECT_STYLE: Record<string, { gradient: string; iconColor: string; icon: React.ElementType }> = {
  unicorns:        { gradient: 'from-blue-500/15 to-indigo-500/15', iconColor: 'text-blue-400', icon: Layers },
  'mpesa-loyalty': { gradient: 'from-emerald-500/15 to-green-500/15', iconColor: 'text-emerald-400', icon: Wallet },
  'wave-showcase': { gradient: 'from-cyan-500/15 to-sky-500/15', iconColor: 'text-cyan-400', icon: Mic },
  'resume-chatbot':{ gradient: 'from-purple-500/15 to-violet-500/15', iconColor: 'text-purple-400', icon: Brain },
  gans:            { gradient: 'from-rose-500/15 to-pink-500/15', iconColor: 'text-rose-400', icon: Cpu },
  refleckt:        { gradient: 'from-amber-500/15 to-orange-500/15', iconColor: 'text-amber-400', icon: Code2 },
  paygohub:        { gradient: 'from-yellow-500/15 to-lime-500/15', iconColor: 'text-yellow-400', icon: Sun },
  elimuai:         { gradient: 'from-teal-500/15 to-cyan-500/15', iconColor: 'text-teal-400', icon: BookOpen },
}

const DEFAULT_STYLE = { gradient: 'from-muted/20 to-muted/10', iconColor: 'text-muted-foreground', icon: Code2 }

/* Deterministic tag color from string hash */
const TAG_COLORS = [
  'bg-blue-500/15 text-blue-300',
  'bg-emerald-500/15 text-emerald-300',
  'bg-purple-500/15 text-purple-300',
  'bg-amber-500/15 text-amber-300',
  'bg-rose-500/15 text-rose-300',
  'bg-cyan-500/15 text-cyan-300',
  'bg-indigo-500/15 text-indigo-300',
  'bg-pink-500/15 text-pink-300',
]

function tagColor(tag: string) {
  let hash = 0
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ProjectCard({ project, index = 0 }: { project: Project; index?: number }) {
  const [open, setOpen] = useState(false)
  const style = PROJECT_STYLE[project.id] ?? DEFAULT_STYLE
  const Icon = style.icon

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ delay: index * 0.06, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className={cn(
          'group relative cursor-pointer overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br p-5 shadow-sm transition-colors duration-300',
          style.gradient,
          'hover:border-white/10 hover:shadow-lg'
        )}
      >
        {/* hover ring */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ring-1 ring-inset ring-white/10" />

        <div className="relative space-y-3">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card/80 shadow-sm backdrop-blur-sm border border-border/40">
              <Icon className={cn('h-5 w-5', style.iconColor)} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold leading-tight text-foreground">{project.name}</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{project.tagline}</p>
            </div>
          </div>

          {/* Description — truncated */}
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {project.description}
          </p>

          {/* Relevance tags */}
          <div className="flex flex-wrap gap-1">
            {project.relevance.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className={cn('rounded-md px-2 py-0.5 text-[10px] font-medium', tagColor(tag))}
              >
                {tag}
              </span>
            ))}
            {project.relevance.length > 4 && (
              <span className="rounded-md bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                +{project.relevance.length - 4}
              </span>
            )}
          </div>

          {/* Tech badges */}
          <div className="flex flex-wrap gap-1">
            {project.tech.slice(0, 5).map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] border-border/40 bg-card/40">
                {t}
              </Badge>
            ))}
            {project.tech.length > 5 && (
              <Badge variant="outline" className="text-[10px] border-border/40 bg-card/40">
                +{project.tech.length - 5}
              </Badge>
            )}
          </div>

          {/* Metrics row */}
          <div className="flex flex-wrap gap-2 pt-1">
            {Object.entries(project.metrics).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 rounded-lg bg-card/60 px-2 py-1 backdrop-blur-sm border border-border/30">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground/60">{key}</span>
                <span className="text-[10px] font-semibold text-foreground">{val}</span>
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="flex gap-2 pt-1">
            {project.url && (
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-blue-400 transition-colors hover:bg-blue-400/10"
              >
                <ExternalLink className="h-3 w-3" />
                Demo
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <GitBranch className="h-3 w-3" />
                Code
              </a>
            )}
          </div>
        </div>
      </motion.div>

      {/* ---- Detail Modal ---- */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring' as const, damping: 25, stiffness: 300 }}
              className="fixed inset-x-4 top-[8%] z-50 mx-auto max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl sm:inset-x-auto"
            >
              {/* Modal gradient header */}
              <div className={cn('bg-gradient-to-br px-6 py-6', style.gradient)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-card/80 shadow-sm backdrop-blur-sm border border-border/40">
                      <Icon className={cn('h-6 w-6', style.iconColor)} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{project.name}</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">{project.tagline}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 px-6 pb-6 pt-5">
                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {project.description}
                </p>

                {/* Highlights */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Highlights
                  </h4>
                  <ul className="space-y-1.5">
                    {project.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', style.iconColor.replace('text-', 'bg-'))} />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metrics */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Metrics
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(project.metrics).map(([key, val]) => (
                      <div key={key} className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/80 px-4 py-3 text-center">
                        <div className="text-sm font-bold text-foreground">{val}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground/60">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relevance */}
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    Wave Relevance
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {project.relevance.map((tag) => (
                      <span
                        key={tag}
                        className={cn('rounded-md px-2.5 py-1 text-[11px] font-medium', tagColor(tag))}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tech */}
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {t}
                    </Badge>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-border/30 pt-4">
                  {project.url && (
                    <Button size="sm" asChild>
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Live Demo
                      </a>
                    </Button>
                  )}
                  {project.github && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={project.github} target="_blank" rel="noopener noreferrer">
                        <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                        Source Code
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
