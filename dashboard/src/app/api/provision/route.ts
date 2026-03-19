import { NextRequest, NextResponse } from 'next/server'
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

const REGION = 'us-east-1'
const lambdaClient = new LambdaClient({ region: REGION })
const bedrockClient = new BedrockRuntimeClient({ region: REGION })

type ServiceState = 'up' | 'starting' | 'stopping' | 'down' | 'not_deployed'

interface ProvisionStatus {
  overall: 'ready' | 'provisioning' | 'partial' | 'down'
  services: {
    name: string
    state: ServiceState
    detail?: string
  }[]
  started_at?: string
}

async function checkLambda(name: string): Promise<ServiceState> {
  try {
    await lambdaClient.send(new GetFunctionCommand({ FunctionName: name }))
    return 'up'
  } catch (err: unknown) {
    const code = (err as { name?: string })?.name
    if (code === 'ResourceNotFoundException') return 'not_deployed'
    return 'down'
  }
}

async function checkBedrock(modelId: string): Promise<ServiceState> {
  try {
    const body = modelId.includes('anthropic')
      ? JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }],
        })
      : JSON.stringify({ inputText: 'test', dimensions: 256, normalize: true })

    await bedrockClient.send(
      new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: new TextEncoder().encode(body),
      })
    )
    return 'up'
  } catch {
    return 'down'
  }
}

async function getStatus(): Promise<ProvisionStatus> {
  const results = await Promise.allSettled([
    checkLambda('wave-submission-handler'),
    checkLambda('wave-voice-handler'),
    checkBedrock('us.anthropic.claude-3-5-haiku-20241022-v1:0'),
    checkBedrock('amazon.titan-embed-text-v2:0'),
    checkLambda('wave-langdetect'),
  ])

  const resolve = (r: PromiseSettledResult<ServiceState>): ServiceState =>
    r.status === 'fulfilled' ? r.value : 'down'

  const services = [
    { name: 'Submission Lambda', state: resolve(results[0]) },
    { name: 'Voice Lambda', state: resolve(results[1]) },
    { name: 'Bedrock Claude', state: resolve(results[2]) },
    { name: 'Bedrock Titan', state: resolve(results[3]) },
    { name: 'Lang Detect', state: resolve(results[4]) },
  ]

  const upCount = services.filter((s) => s.state === 'up').length
  const startingCount = services.filter((s) => s.state === 'starting').length

  let overall: ProvisionStatus['overall'] = 'down'
  if (upCount === services.length) overall = 'ready'
  else if (upCount > 0 || startingCount > 0) overall = 'partial'
  else if (startingCount > 0) overall = 'provisioning'

  return { overall, services }
}

export async function GET() {
  const status = await getStatus()
  return NextResponse.json(status)
}

export async function POST(request: NextRequest) {
  const { action } = await request.json()

  if (action === 'status') {
    const status = await getStatus()
    return NextResponse.json(status)
  }

  return NextResponse.json({ error: 'Invalid action. Language detection is now serverless (no start/stop needed).' }, { status: 400 })
}
