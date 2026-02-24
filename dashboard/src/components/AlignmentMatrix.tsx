'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import alignment from '@/data/alignment.json'
import type { AlignmentRequirement } from '@/types'

const CATEGORIES = ['All', 'Required', 'Bonus', 'Wave Stack'] as const
type Category = (typeof CATEGORIES)[number]

const STRENGTH_STYLES: Record<string, string> = {
  exceptional: 'bg-green-500/20 text-green-400 border-green-500/30',
  strong: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

const row = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0 },
}

export default function AlignmentMatrix() {
  const [filter, setFilter] = useState<Category>('All')

  const requirements = alignment.requirements as unknown as AlignmentRequirement[]
  const filtered = useMemo(
    () =>
      filter === 'All'
        ? requirements
        : requirements.filter((r) => r.category === filter),
    [filter, requirements]
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={filter === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Category</TableHead>
              <TableHead>Requirement</TableHead>
              <TableHead className="hidden md:table-cell">Evidence</TableHead>
              <TableHead className="w-[110px]">Strength</TableHead>
              <TableHead className="hidden lg:table-cell">Projects</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <motion.tbody
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.05 } },
              }}
              // Nested tbody is intentional — framer-motion needs a motion element
              // around the rows for stagger. The outer TableBody provides the shadcn
              // styles, this inner one drives the animation.
              className="contents"
            >
              {filtered.map((req, i) => (
                <motion.tr
                  key={`${req.category}-${i}`}
                  variants={row}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {req.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {req.requirement}
                  </TableCell>
                  <TableCell className="hidden max-w-xs text-sm text-muted-foreground md:table-cell">
                    {req.evidence}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize',
                        STRENGTH_STYLES[req.strength]
                      )}
                    >
                      {req.strength}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {req.projects.map((p) => (
                        <Badge key={p} variant="secondary" className="text-xs">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </motion.tbody>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
