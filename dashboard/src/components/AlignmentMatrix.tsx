'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import alignment from '@/data/alignment.json'
import type { AlignmentRequirement } from '@/types'

const CATEGORIES = ['All', 'Required', 'Bonus', 'Wave Stack'] as const
type Category = (typeof CATEGORIES)[number]

/* ------------------------------------------------------------------ */
/*  Category gradient backgrounds for cards                           */
/* ------------------------------------------------------------------ */
const CATEGORY_GRADIENTS: Record<string, string> = {
  Required:
    'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-transparent border-red-500/20 hover:border-red-400/40',
  Bonus:
    'bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-transparent border-purple-500/20 hover:border-purple-400/40',
  'Wave Stack':
    'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border-cyan-500/20 hover:border-cyan-400/40',
}

/* ------------------------------------------------------------------ */
/*  Category badge styles                                             */
/* ------------------------------------------------------------------ */
const CATEGORY_BADGE: Record<string, string> = {
  Required: 'bg-red-500/15 text-red-400 border-red-500/30',
  Bonus: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Wave Stack': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
}

/* ------------------------------------------------------------------ */
/*  Strength styles + bar widths                                      */
/* ------------------------------------------------------------------ */
const STRENGTH_STYLES: Record<string, string> = {
  exceptional: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  strong: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  moderate: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
}

const STRENGTH_BAR_COLOR: Record<string, string> = {
  exceptional: 'bg-emerald-500',
  strong: 'bg-blue-500',
  moderate: 'bg-amber-500',
}


/* ------------------------------------------------------------------ */
/*  Project tag color rotation                                        */
/* ------------------------------------------------------------------ */
const PROJECT_COLORS = [
  'bg-sky-500/15 text-sky-300 border-sky-500/25',
  'bg-violet-500/15 text-violet-300 border-violet-500/25',
  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'bg-pink-500/15 text-pink-300 border-pink-500/25',
  'bg-teal-500/15 text-teal-300 border-teal-500/25',
  'bg-orange-500/15 text-orange-300 border-orange-500/25',
  'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
]

function projectColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return PROJECT_COLORS[Math.abs(hash) % PROJECT_COLORS.length]
}

/* ------------------------------------------------------------------ */
/*  Motion variants                                                   */
/* ------------------------------------------------------------------ */
const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 340, damping: 28 } },
  exit: { opacity: 0, scale: 0.92, y: 24, transition: { duration: 0.18 } },
}

/* ================================================================== */
/*  Component                                                         */
/* ================================================================== */
export default function AlignmentMatrix() {
  const [filter, setFilter] = useState<Category>('All')
  const [selected, setSelected] = useState<AlignmentRequirement | null>(null)

  const requirements = alignment.requirements as unknown as AlignmentRequirement[]

  const filtered = useMemo(
    () =>
      filter === 'All'
        ? requirements
        : requirements.filter((r) => r.category === filter),
    [filter, requirements]
  )

  const counts = useMemo(
    () => ({
      All: requirements.length,
      Required: requirements.filter((r) => r.category === 'Required').length,
      Bonus: requirements.filter((r) => r.category === 'Bonus').length,
      'Wave Stack': requirements.filter((r) => r.category === 'Wave Stack').length,
    }),
    [requirements]
  )

  return (
    <>
      <div className="space-y-5">
        {/* ---- Filter Tabs ---- */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
              className="gap-1.5"
            >
              {cat}
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                {counts[cat]}
              </span>
            </Button>
          ))}
        </div>

        {/* ---- Card Grid ---- */}
        <motion.div
          key={filter}
          initial="hidden"
          animate="show"
          variants={containerVariants}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((req, i) => (
            <motion.button
              key={`${req.category}-${req.requirement}-${i}`}
              variants={cardVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.985 }}
              onClick={() => setSelected(req)}
              className={cn(
                'group relative cursor-pointer rounded-xl border p-4 text-left transition-shadow hover:shadow-lg hover:shadow-black/10',
                CATEGORY_GRADIENTS[req.category]
              )}
            >
              {/* Header: category + strength */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-[10px] font-semibold uppercase tracking-wide', CATEGORY_BADGE[req.category])}
                >
                  {req.category}
                </Badge>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                    STRENGTH_STYLES[req.strength]
                  )}
                >
                  {req.strength}
                </span>
              </div>

              {/* Requirement title */}
              <h3 className="mb-2 text-sm font-semibold leading-snug text-foreground">
                {req.requirement}
              </h3>

              {/* Truncated evidence (2 lines) */}
              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {req.evidence}
              </p>

              {/* Project tags */}
              <div className="flex flex-wrap gap-1">
                {req.projects.map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className={cn('text-[10px] font-normal', projectColor(p))}
                  >
                    {p}
                  </Badge>
                ))}
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* ---- Detail Modal ---- */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelected(null)}
            />

            {/* Modal panel */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border p-6 shadow-2xl',
                'bg-card',
                CATEGORY_GRADIENTS[selected.category]
              )}
            >
              {/* Close button */}
              <button
                onClick={() => setSelected(null)}
                aria-label="Close detail modal"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Category + strength header */}
              <div className="mb-4 flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={cn('text-[10px] font-semibold uppercase tracking-wide', CATEGORY_BADGE[selected.category])}
                >
                  {selected.category}
                </Badge>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                    STRENGTH_STYLES[selected.strength]
                  )}
                >
                  {selected.strength}
                </span>
              </div>

              {/* Requirement title */}
              <h2 className="mb-3 text-lg font-bold leading-snug text-foreground">
                {selected.requirement}
              </h2>

              {/* Full evidence */}
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                {selected.evidence}
              </p>

              {/* Strength visual bar */}
              <div className="mb-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">
                    Strength
                  </span>
                  <span
                    className={cn(
                      'text-xs font-semibold capitalize',
                      selected.strength === 'exceptional' && 'text-emerald-400',
                      selected.strength === 'strong' && 'text-blue-400',
                      selected.strength === 'moderate' && 'text-amber-400'
                    )}
                  >
                    {selected.strength}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    className={cn('h-full rounded-full', STRENGTH_BAR_COLOR[selected.strength])}
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      maxWidth:
                        selected.strength === 'exceptional'
                          ? '100%'
                          : selected.strength === 'strong'
                            ? '75%'
                            : '50%',
                    }}
                  />
                </div>
              </div>

              {/* Project tags */}
              <div>
                <span className="mb-2 block text-xs font-medium text-muted-foreground">
                  Demonstrated In
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selected.projects.map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className={cn('text-xs font-normal', projectColor(p))}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
