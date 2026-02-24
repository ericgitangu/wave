import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { pushSubmission } from '@/lib/redis'
import type { SubmissionEntry } from '@/lib/redis'

const ENDPOINT = 'https://api.wave.com/submit_resume'
const TOKEN = process.env.WAVE_BEARER_TOKEN ?? 'wave_KE_ericgitangu'

function eatNow(): string {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Africa/Nairobi' }).replace(' ', 'T') + '+03:00'
}

export async function POST() {
  const timestamp = eatNow()
  const id = `wave-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`

  try {
    // Load resume payload — try multiple paths for local dev vs Docker
    const paths = [
      join(process.cwd(), 'public', 'resume.json'),     // Docker / standalone
      join(process.cwd(), '..', 'payload', 'resume.json'), // local dev (monorepo root)
    ]
    let payload: Record<string, unknown> | null = null

    for (const p of paths) {
      try {
        const raw = await readFile(p, 'utf-8')
        payload = JSON.parse(raw)
        break
      } catch { /* try next path */ }
    }

    if (!payload) {
      // Fallback inline payload if file not found (e.g. in Docker)
      payload = {
        name: 'Eric Gitangu',
        email: 'developer.ericgitangu@gmail.com',
        phone: '+254 708 078 997',
        location: 'Nairobi, Kenya',
        position: 'Senior Machine Learning Engineer - LLM & Voice',
        links: {
          linkedin: 'https://linkedin.com/in/ericgitangu',
          github: 'https://github.com/ericgitangu',
          portfolio: 'https://developer.ericgitangu.com',
          resume: 'https://resume.ericgitangu.com',
          showcase: 'https://wave-apply.ericgitangu.com',
        },
        summary:
          'Full-stack engineer with 10+ years experience, based in Nairobi. Deep expertise in Python, event-driven systems, M-Pesa payment integrations, and AI/ML.',
      }
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    })

    const text = await res.text()
    let body: unknown
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }

    // Determine status label from HTTP response
    const statusLabel =
      res.status === 200 || res.status === 201
        ? 'delivered'
        : res.status === 401
          ? 'auth_rejected'
          : res.status === 429
            ? 'rate_limited'
            : `http_${res.status}`

    const entry: SubmissionEntry = {
      id,
      timestamp,
      status: statusLabel,
      endpoint: ENDPOINT,
      name: 'Eric Gitangu',
      http_status: res.status,
    }

    // Persist to Upstash Redis
    await pushSubmission(entry)

    return NextResponse.json({
      id,
      status: res.status,
      statusText: res.statusText,
      body,
      endpoint: ENDPOINT,
      timestamp,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    const entry: SubmissionEntry = {
      id,
      timestamp,
      status: 'error',
      endpoint: ENDPOINT,
      name: 'Eric Gitangu',
      http_status: 502,
    }

    // Persist error to Redis too
    await pushSubmission(entry).catch(() => {})

    return NextResponse.json(
      { id, error: message, endpoint: ENDPOINT, timestamp },
      { status: 502 }
    )
  }
}
