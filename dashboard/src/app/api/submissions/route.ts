import { NextResponse } from 'next/server'
import { getSubmissions } from '@/lib/redis'

export async function GET() {
  const now = new Date().toLocaleString('sv-SE', { timeZone: 'Africa/Nairobi' }).replace(' ', 'T') + '+03:00'

  try {
    const submissions = await getSubmissions()
    return NextResponse.json({
      submissions,
      count: submissions.length,
      last_checked: now,
    })
  } catch {
    // Redis unavailable — return empty
    return NextResponse.json({
      submissions: [],
      count: 0,
      last_checked: now,
      _error: 'Redis unavailable',
    })
  }
}
