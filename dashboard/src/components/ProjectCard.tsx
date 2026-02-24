'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, GitBranch, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { Project } from '@/types'

function MetricRing({
  label,
  value,
}: {
  label: string
  value: string
}) {
  const radius = 28
  const stroke = 4
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <defs>
          <linearGradient
            id={`metric-${label}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={`url(#metric-${label})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.15}
        />
      </svg>
      <span className="text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  )
}

export default function ProjectCard({ project }: { project: Project }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Card
          className="group cursor-pointer border-border/50 transition-all hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5"
          onClick={() => setOpen(true)}
        >
          <CardHeader>
            <CardTitle className="text-base">{project.name}</CardTitle>
            <CardDescription>{project.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {project.relevance.map((tag) => (
                <Badge key={tag} variant="default" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {project.tech.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              {project.url && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <a href={project.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Demo
                  </a>
                </Button>
              )}
              {project.github && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitBranch className="mr-1 h-3 w-3" />
                    Code
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <div className="-mx-6 -mt-6 rounded-t-lg bg-gradient-to-br from-blue-600/20 to-indigo-600/20 px-6 py-6">
            <DialogHeader>
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              <DialogDescription>{project.tagline}</DialogDescription>
            </DialogHeader>
          </div>

          <div className="space-y-5 pt-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {project.description}
            </p>

            <div>
              <h4 className="mb-2 text-sm font-semibold">Highlights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {project.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold">Metrics</h4>
              <div className="flex flex-wrap gap-4">
                {Object.entries(project.metrics).map(([key, val]) => (
                  <MetricRing key={key} label={key} value={val} />
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {project.tech.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              {project.url && (
                <Button size="sm" asChild>
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-1 h-3 w-3" />
                    Live Demo
                  </a>
                </Button>
              )}
              {project.github && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <GitBranch className="mr-1 h-3 w-3" />
                    Source
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setOpen(false)}
              >
                <X className="mr-1 h-3 w-3" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
