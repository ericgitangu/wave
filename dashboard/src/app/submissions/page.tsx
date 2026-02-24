'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  ChevronDown,
  ExternalLink,
  Clock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { notifySuccess, notifyWarning, notifyError } from '@/lib/notify'
import { useAppStatus } from '@/context/app-status-context'

const ENDPOINT = 'https://api.wave.com/submit_resume'
const TOKEN = 'wave_KE_ericgitangu'

interface TriggerResult {
  status: number
  statusText: string
  body: string
  timestamp: string
}

const ackStatusStyle: Record<string, string> = {
  delivered: 'bg-green-500/20 text-green-400',
  sent: 'bg-blue-500/20 text-blue-400',
  acknowledged: 'bg-green-500/20 text-green-400',
  pending: 'bg-amber-500/20 text-amber-400',
  auth_rejected: 'bg-red-500/20 text-red-400',
  rate_limited: 'bg-amber-500/20 text-amber-400',
  error: 'bg-red-500/20 text-red-400',
}

const PAYLOAD_PREVIEW = {
  meta: { timezone: 'Africa/Nairobi', version: '2.0', author: 'Eric Gitangu (Deveric)' },
  applicant: {
    name: 'Eric Gitangu',
    email: 'developer.ericgitangu@gmail.com',
    phone: '+254 708 078 997',
    location: { city: 'Nairobi', country: 'Kenya', timezone: 'EAT (UTC+3)' },
    position: 'Senior Machine Learning Engineer - LLM & Voice',
    languages_spoken: [
      { language: 'English', proficiency: 'native' },
      { language: 'Swahili', proficiency: 'native' },
    ],
  },
  links: {
    linkedin: 'https://linkedin.com/in/ericgitangu',
    github: 'https://github.com/ericgitangu',
    portfolio: 'https://developer.ericgitangu.com',
    resume: 'https://resume.ericgitangu.com',
    showcase: 'https://wave-apply.ericgitangu.com',
  },
  summary:
    'Full-stack engineer with 10+ years experience, based in Nairobi...',
  experience: '[ 9 roles — Ignite, ENGIE, Vishnu, Baw Bab, RGA, Deveric, Vecima, Veracode, IBM ]',
  skills: {
    languages: { primary: ['Python', 'TypeScript', 'Rust'], proficient: ['Java', 'Node.js', 'Go'] },
    ml_ai: { llm: ['RAG', 'agent orchestration'], platforms: ['Bedrock', 'SageMaker', 'Claude'] },
    infrastructure: { cloud: ['AWS', 'GCP', 'Azure'], messaging: ['Kafka', 'EventBridge', 'SQS/SNS'] },
  },
  projects: '[ 9 — Wave Showcase, UniCorns, M-PESA Engine, Resume AI, GANs, Refleckt, PayGoHub, ElimuAI, perf-monitor-rs ]',
  education: { degree: 'B.S. Computer Science', institution: 'UMass Lowell', honors: ['Microsoft Scholarship', 'Google Scholarship'] },
  certifications: { count: 80, highlights: ['TensorFlow Developer', 'Rust Specialization (Duke)', 'Meta Back-End Developer'] },
  wave_fit: {
    mobile_money: { platforms: ['M-Pesa', 'Airtel Money', 'MTN'], highlight: '50M+ user loyalty engine' },
    key_strengths: ['M-Pesa at scale', 'Rust+Python polyglot', 'Native Swahili speaker', 'Africa-first products'],
  },
}

export default function SubmissionsPage() {
  const { submissions, submissionCount, lastAck, refreshNow } = useAppStatus()
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<TriggerResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPayload, setShowPayload] = useState(false)
  const [copied, setCopied] = useState(false)
  const [triggerHistory, setTriggerHistory] = useState<TriggerResult[]>([])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/submissions/trigger', { method: 'POST' })
      const json = await res.json()

      const entry: TriggerResult = {
        status: json.status ?? res.status,
        statusText: json.statusText ?? res.statusText,
        body: JSON.stringify(json.body ?? json, null, 2),
        timestamp: new Date().toISOString(),
      }

      setResult(entry)
      setTriggerHistory((prev) => [entry, ...prev].slice(0, 10))

      // Haptic toast for result
      if (entry.status < 300) {
        notifySuccess('Submission delivered', `Wave API returned ${entry.status}`)
      } else if (entry.status === 401) {
        notifyWarning('Auth rejected', 'Bearer token not recognized by Wave API')
      } else {
        notifyError(`HTTP ${entry.status}`, entry.statusText)
      }

      // Refresh submissions list after triggering
      setTimeout(refreshNow, 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error'
      setError(msg)
      notifyError('Submission failed', msg)
    } finally {
      setSubmitting(false)
    }
  }, [refreshNow])

  const copyPayload = useCallback(async () => {
    await navigator.clipboard.writeText(
      JSON.stringify(PAYLOAD_PREVIEW, null, 2)
    )
    setCopied(true)
    notifySuccess('Payload copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Submissions
          </h1>
          <p className="text-muted-foreground">
            Trigger and track resume submissions to Wave&apos;s API.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshNow} className="shrink-0 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{submissionCount}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Submission</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-sm font-semibold text-foreground">
              {lastAck ? new Date(lastAck.timestamp).toLocaleString() : 'None'}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 text-[10px]">
                POST
              </Badge>
              <code className="text-xs text-foreground truncate">{ENDPOINT}</code>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Past Submissions Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Submission History</h3>
          <p className="text-xs text-muted-foreground">
            Tracked deliveries with IDs, timestamps, and acknowledgement status.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <AlertTriangle className="h-5 w-5 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No submissions tracked yet. Use the trigger below to submit.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead className="hidden md:table-cell">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((sub) => {
                const date = new Date(sub.timestamp)
                return (
                  <TableRow
                    key={sub.id}
                    className={lastAck?.id === sub.id ? 'bg-accent/50' : ''}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {sub.id}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {date.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {date.toLocaleTimeString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', ackStatusStyle[sub.status] ?? '')}
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                      {sub.endpoint}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                      {sub.name ?? '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Trigger Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Manual Trigger</h3>
          <p className="text-xs text-muted-foreground">
            POST the full resume.json payload to Wave&apos;s API with bearer token authorization.
          </p>
        </div>

        <div className="p-4 space-y-4">
          {/* Token info */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="text-blue-400 font-medium">Bearer:</span>
            <code className="font-mono">{TOKEN}</code>
            <span className="text-muted-foreground/50">|</span>
            <span className="text-blue-400 font-medium">Format:</span>
            <span>wave_ + country_code + _ + id</span>
          </div>

          {/* Payload preview toggle */}
          <button
            onClick={() => setShowPayload((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-left hover:bg-accent/30 transition-colors"
          >
            <div>
              <span className="text-xs font-medium text-foreground">JSON Payload Preview</span>
              <span className="ml-2 text-[10px] text-muted-foreground">
                resume, links, experience, skills, wave_fit
              </span>
            </div>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 text-muted-foreground transition-transform',
                showPayload && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showPayload && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="relative rounded-lg border border-border/50 bg-accent/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyPayload}
                    className="absolute right-2 top-2 gap-1.5 text-xs"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <pre className="max-h-[300px] overflow-auto p-4 text-xs text-muted-foreground">
                    {JSON.stringify(PAYLOAD_PREVIEW, null, 2)}
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit button */}
          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 px-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Submit to Wave API
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Trigger Response */}
      <AnimatePresence>
        {(result || error) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card
              className={cn(
                'border',
                error
                  ? 'border-red-500/30'
                  : result && result.status < 400
                    ? 'border-green-500/30'
                    : 'border-amber-500/30'
              )}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {error ? 'Error' : 'API Response'}
                </CardTitle>
                {result && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      result.status < 400
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    )}
                  >
                    {result.status} {result.statusText}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="flex items-center gap-2 text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                ) : result ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                    <pre className="max-h-[200px] overflow-auto rounded-md bg-accent/30 p-3 text-xs text-muted-foreground">
                      {result.body}
                    </pre>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Trigger History */}
      {triggerHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card"
        >
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Session Trigger Log</h3>
            <p className="text-xs text-muted-foreground">
              Manual triggers fired during this session
            </p>
          </div>
          <div className="divide-y divide-border">
            {triggerHistory.map((entry, i) => (
              <div
                key={`${entry.timestamp}-${i}`}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                {entry.status < 400 ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px]',
                        entry.status < 400
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      )}
                    >
                      {entry.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground truncate">
                      {entry.statusText}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Instructions footer */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-lg border border-border/50 bg-accent/30 p-4 space-y-3"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Wave&apos;s Submission Instructions
        </p>
        <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
          <p>
            <span className="text-blue-400">Endpoint:</span> POST{' '}
            <a
              href={ENDPOINT}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              {ENDPOINT}
              <ExternalLink className="ml-1 inline h-2.5 w-2.5" />
            </a>
          </p>
          <p>
            <span className="text-blue-400">Bearer token:</span> wave_ +
            (country code) + _ + [any characters]
          </p>
          <p>
            <span className="text-blue-400">Our token:</span> {TOKEN}
          </p>
          <p>
            <span className="text-blue-400">Content-Type:</span> application/json
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground/60">
          Payload stored for up to 30 days for review, then deleted.
        </p>
      </motion.div>
    </div>
  )
}
