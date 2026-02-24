'use client'

import { motion } from 'framer-motion'
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock, Brain, Cpu } from 'lucide-react'
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
import SystemStatusCharts from '@/components/SystemStatusCharts'
import ProvisioningGate from '@/components/ProvisioningGate'
import { useAppStatus } from '@/context/app-status-context'

const statusIcon = (s: string) => {
  if (s === 'up' || s === 'healthy') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  if (s === 'degraded') return <AlertTriangle className="h-5 w-5 text-amber-500" />
  return <XCircle className="h-5 w-5 text-red-500" />
}

const ackStatusStyle: Record<string, string> = {
  acknowledged: 'bg-green-500/20 text-green-400 dark:text-green-400',
  pending: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
  delivered: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
}

export default function StatusPage() {
  const { health, submissions, submissionCount, lastAck, isPolling, refreshNow } = useAppStatus()

  return (
    <ProvisioningGate>
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">System Status</h1>
          <p className="text-muted-foreground">
            Real-time health, submission acknowledgements, and performance metrics.
            {isPolling && <span className="ml-2 text-xs text-green-500">Polling every 30s</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshNow} className="shrink-0 gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Health Indicators */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dashboard</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {statusIcon(health.dashboard)}
            <span className="text-lg font-semibold capitalize text-foreground">{health.dashboard}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Voice API</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {statusIcon(health.voice_api)}
            <span className="text-lg font-semibold capitalize text-foreground">{health.voice_api}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submission API</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {statusIcon(health.submission)}
            <span className="text-lg font-semibold capitalize text-foreground">{health.submission}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bedrock (Claude)</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {statusIcon(health.bedrock_claude)}
            <span className="text-lg font-semibold capitalize text-foreground">{health.bedrock_claude}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bedrock (Titan)</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {statusIcon(health.bedrock_titan)}
            <span className="text-lg font-semibold capitalize text-foreground">{health.bedrock_titan}</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">SageMaker</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            {statusIcon(health.sagemaker)}
            <span className="text-lg font-semibold capitalize text-foreground">{health.sagemaker}</span>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submission Count */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submissions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-foreground">{submissionCount}</span>
            <p className="text-xs text-muted-foreground">
              Last check: {new Date(health.last_check).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Submission Acknowledgements */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl border border-border bg-card"
      >
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold text-foreground">Submission Acknowledgements</h3>
          <p className="text-xs text-muted-foreground">
            Tracked deliveries with timestamps and unique IDs. Personal info is optional.
          </p>
        </div>

        {submissions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No submissions tracked yet. Submit your resume to see acknowledgements here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead className="hidden md:table-cell">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((ack) => (
                <TableRow key={ack.id} className={lastAck?.id === ack.id ? 'bg-accent/50' : ''}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {ack.id}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(ack.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${ackStatusStyle[ack.status] ?? ''}`}
                    >
                      {ack.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {ack.endpoint}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {ack.name ?? '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Charts */}
      <SystemStatusCharts />

    </div>
    </ProvisioningGate>
  )
}
