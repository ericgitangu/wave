'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import architecture from '@/data/architecture.json'
import type { ArchitectureData } from '@/types'

const data: ArchitectureData = architecture as ArchitectureData

export default function ArchitectureDiagram() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function renderDiagram() {
      const mermaid = (await import('mermaid')).default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          primaryColor: '#1a56db',
          primaryTextColor: '#e2e8f0',
          primaryBorderColor: '#3b82f6',
          lineColor: '#64748b',
          secondaryColor: '#312e81',
          tertiaryColor: '#1e293b',
        },
      })

      if (cancelled || !containerRef.current) return

      try {
        const { svg } = await mermaid.render('arch-diagram', data.diagram)
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg
          setRendered(true)
        }
      } catch {
        if (!cancelled && containerRef.current) {
          containerRef.current.textContent =
            'Diagram rendering failed. Check the mermaid syntax.'
        }
      }
    }

    renderDiagram()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-8">
      {/* Diagram */}
      <div className="overflow-x-auto rounded-xl border border-border bg-card p-4">
        <h2 className="mb-4 text-lg font-semibold">{data.title}</h2>
        <p className="mb-4 text-sm text-muted-foreground">{data.description}</p>
        <div
          ref={containerRef}
          className={cn(
            'flex justify-center transition-opacity',
            rendered ? 'opacity-100' : 'opacity-50'
          )}
        />
      </div>

      {/* Components table */}
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Technology</TableHead>
              <TableHead className="hidden sm:table-cell">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.components.map((c) => (
              <TableRow key={c.name}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.tech}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {c.note}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Design decisions */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Design Decisions</h3>
        {data.design_decisions.map((d) => (
          <Collapsible key={d.decision}>
            <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent">
              {d.decision}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="px-4 pb-3 pt-2 text-sm text-muted-foreground">
              {d.rationale}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  )
}
