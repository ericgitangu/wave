'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SubmissionData {
  status: 'submitted' | 'pending' | 'processing'
  progress: number
  timestamp: string
}

const STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  pending: 'Pending',
  processing: 'Processing',
}

function ProgressRing({
  progress,
  active,
}: {
  progress: number
  active: boolean
}) {
  const radius = 52
  const stroke = 6
  const normalizedRadius = radius - stroke / 2
  const circumference = 2 * Math.PI * normalizedRadius
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      {active && (
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-blue-500/20"
        />
      )}
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
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className="absolute text-lg font-semibold text-foreground">
        {progress}%
      </span>
    </div>
  )
}

export default function SubmissionStatus() {
  const [data, setData] = useState<SubmissionData>({
    status: 'submitted',
    progress: 100,
    timestamp: new Date().toISOString(),
  })
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/submissions')
      if (!res.ok) throw new Error('Failed to fetch status')
      const json: SubmissionData = await res.json()
      setData(json)
      setError(null)
    } catch {
      // Fall back to default state on error — the ring still renders.
      setError('Could not reach submission API')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const active = data.status === 'processing' || data.status === 'pending'

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-6">
      <ProgressRing progress={data.progress} active={active} />

      <div className="text-center">
        <p
          className={cn(
            'text-sm font-semibold',
            data.status === 'submitted' && 'text-green-400',
            data.status === 'pending' && 'text-amber-400',
            data.status === 'processing' && 'text-blue-400'
          )}
        >
          {STATUS_LABELS[data.status]}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {new Date(data.timestamp).toLocaleString()}
        </p>
        {error && (
          <p className="mt-2 text-xs text-amber-500">{error}</p>
        )}
      </div>
    </div>
  )
}
