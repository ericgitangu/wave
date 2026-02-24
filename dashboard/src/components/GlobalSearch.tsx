'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Mic, MicOff, Command } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import projects from '@/data/projects.json'
import alignment from '@/data/alignment.json'
import architecture from '@/data/architecture.json'
import type { AlignmentRequirement, ArchitectureData } from '@/types'

const PAGE_SIZE = 5

interface SearchResult {
  category: 'Project' | 'Alignment' | 'Architecture'
  title: string
  description: string
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = []

  projects.projects.forEach((p) => {
    results.push({
      category: 'Project',
      title: p.name,
      description: `${p.tagline} — ${p.tech.join(', ')}`,
    })
  })

  ;(alignment.requirements as unknown as AlignmentRequirement[]).forEach((r) => {
    results.push({
      category: 'Alignment',
      title: r.requirement,
      description: r.evidence,
    })
  })

  const arch = architecture as ArchitectureData
  arch.components.forEach((c) => {
    results.push({
      category: 'Architecture',
      title: c.name,
      description: `${c.tech} — ${c.note}`,
    })
  })

  arch.design_decisions.forEach((d) => {
    results.push({
      category: 'Architecture',
      title: d.decision,
      description: d.rationale,
    })
  })

  return results
}

const allResults = buildIndex()

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState(0)
  const [listening, setListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Cmd+K / Ctrl+K to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery('')
      setPage(0)
      setSelected(0)
    }
  }

  // Wrapper that also resets page/selected on query change
  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(0)
    setSelected(0)
  }

  // Search — simple substring matching across title and description
  const filtered = useMemo(() => {
    if (!query.trim()) return allResults
    const lower = query.toLowerCase()
    return allResults.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.description.toLowerCase().includes(lower)
    )
  }, [query])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageResults = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelected((prev) => Math.min(prev + 1, pageResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelected((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'ArrowRight' && page < totalPages - 1) {
        e.preventDefault()
        setPage((prev) => prev + 1)
        setSelected(0)
      } else if (e.key === 'ArrowLeft' && page > 0) {
        e.preventDefault()
        setPage((prev) => prev - 1)
        setSelected(0)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    },
    [page, totalPages, pageResults.length]
  )

  // Voice input
  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0]?.[0]?.transcript ?? ''
      handleQueryChange(transcript)
      setListening(false)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const CATEGORY_COLORS: Record<string, string> = {
    Project: 'bg-blue-500/20 text-blue-400',
    Alignment: 'bg-green-500/20 text-green-400',
    Architecture: 'bg-purple-500/20 text-purple-400',
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-blue-500/40 hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="ml-2 hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
          <Command className="mr-0.5 inline h-2.5 w-2.5" />K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="top-[20%] translate-y-0 gap-0 p-0 sm:max-w-xl [&>button]:hidden">
          <DialogTitle className="sr-only">Search</DialogTitle>

          {/* Search input */}
          <div className="flex items-center border-b border-border px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search projects, alignment, architecture..."
              className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              onClick={toggleVoice}
              className={cn(
                'p-1 text-muted-foreground transition-colors hover:text-foreground',
                listening && 'text-red-400'
              )}
            >
              {listening ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[320px] overflow-y-auto p-2">
            <AnimatePresence mode="wait">
              {pageResults.length === 0 ? (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  No results found.
                </motion.p>
              ) : (
                <motion.div
                  key={`page-${page}-${query}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-1"
                >
                  {pageResults.map((r, i) => (
                    <div
                      key={`${r.title}-${i}`}
                      className={cn(
                        'flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        i === selected && 'bg-accent'
                      )}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <Badge
                        variant="secondary"
                        className={cn(
                          'mt-0.5 shrink-0 text-[10px]',
                          CATEGORY_COLORS[r.category]
                        )}
                      >
                        {r.category}
                      </Badge>
                      <div className="min-w-0">
                        <p className="font-medium">{r.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => {
                    setPage((p) => p - 1)
                    setSelected(0)
                  }}
                >
                  Prev
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => {
                    setPage((p) => p + 1)
                    setSelected(0)
                  }}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
