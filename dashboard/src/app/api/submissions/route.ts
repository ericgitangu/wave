import { NextResponse } from 'next/server'
import { encrypt } from '@/lib/crypto'

const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'wave-ack-default-key'

function shortGuid(): string {
  return crypto.randomUUID().slice(0, 8)
}

export async function GET() {
  const now = new Date().toISOString()

  const submissions = [
    {
      id: shortGuid(),
      timestamp: '2026-02-24T00:00:00Z',
      status: 'acknowledged',
      endpoint: 'https://api.wave.com/submit_resume',
    },
  ]

  const payload = { submissions, count: submissions.length, last_checked: now }

  // Encrypt payload for transit
  const encrypted = await encrypt(JSON.stringify(payload), ENCRYPTION_KEY)

  return NextResponse.json({
    ...payload,
    _encrypted: encrypted,
  })
}
