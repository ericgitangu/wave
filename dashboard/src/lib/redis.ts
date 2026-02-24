import { Redis } from '@upstash/redis'

// Upstash Redis — free tier: 10K commands/day, 256MB
// Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in env
export const redis = Redis.fromEnv()

const SUBMISSIONS_KEY = 'wave:submissions'
const MAX_ENTRIES = 50

export interface SubmissionEntry {
  id: string
  timestamp: string
  status: string
  endpoint: string
  name: string
  http_status: number
}

export async function pushSubmission(entry: SubmissionEntry): Promise<void> {
  await redis.lpush(SUBMISSIONS_KEY, JSON.stringify(entry))
  await redis.ltrim(SUBMISSIONS_KEY, 0, MAX_ENTRIES - 1)
}

export async function getSubmissions(): Promise<SubmissionEntry[]> {
  const raw = await redis.lrange<string>(SUBMISSIONS_KEY, 0, MAX_ENTRIES - 1)
  return raw.map((item) =>
    typeof item === 'string' ? JSON.parse(item) : item
  ) as SubmissionEntry[]
}
