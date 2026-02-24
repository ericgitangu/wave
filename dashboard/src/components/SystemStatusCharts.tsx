'use client'

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useAppStatus } from '@/context/app-status-context'

const submissionData = [
  { date: 'Mon', count: 2 },
  { date: 'Tue', count: 5 },
  { date: 'Wed', count: 3 },
  { date: 'Thu', count: 8 },
  { date: 'Fri', count: 6 },
  { date: 'Sat', count: 4 },
  { date: 'Sun', count: 7 },
]

const latencyData = [
  { time: '00:00', p50: 120, p95: 240, p99: 380 },
  { time: '04:00', p50: 110, p95: 220, p99: 350 },
  { time: '08:00', p50: 150, p95: 310, p99: 520 },
  { time: '12:00', p50: 180, p95: 380, p99: 600 },
  { time: '16:00', p50: 160, p95: 330, p99: 480 },
  { time: '20:00', p50: 130, p95: 260, p99: 400 },
  { time: '24:00', p50: 115, p95: 230, p99: 360 },
]

const STATUS_COLORS: Record<string, string> = {
  up: 'bg-green-500',
  healthy: 'bg-green-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
}

interface ServiceEntry {
  name: string
  status: string
}

export default function SystemStatusCharts() {
  const { health } = useAppStatus()

  // Real service health from live probes
  const services: ServiceEntry[] = [
    { name: 'API Gateway', status: health.voice_api },
    { name: 'Voice Pipeline', status: health.voice_api },
    { name: 'Bedrock (Claude)', status: health.bedrock_claude },
    { name: 'Bedrock (Titan)', status: health.bedrock_titan },
    { name: 'SageMaker', status: health.sagemaker },
    { name: 'DynamoDB', status: health.submission },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Submissions timeline */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">Submission Timeline</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={submissionData}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--color-chart-1)"
              fill="url(#areaGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Latency chart */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">
          Latency (P50 / P95 / P99)
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={latencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--color-muted-foreground)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              unit="ms"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="p50"
              stroke="var(--color-chart-2)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p95"
              stroke="var(--color-chart-3)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="p99"
              stroke="var(--color-chart-5)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Health status — real data from live probes */}
      <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold">Service Health</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
            >
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_COLORS[s.status] ?? 'bg-gray-500'}`}
              />
              <span className="text-sm">{s.name}</span>
              <span className="ml-auto text-xs capitalize text-muted-foreground">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
