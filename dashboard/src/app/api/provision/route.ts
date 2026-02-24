import { NextRequest, NextResponse } from 'next/server'
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda'
import {
  SageMakerClient,
  DescribeEndpointCommand,
  CreateEndpointCommand,
  DeleteEndpointCommand,
} from '@aws-sdk/client-sagemaker'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

const REGION = 'us-east-1'
const lambdaClient = new LambdaClient({ region: REGION })
const sagemakerClient = new SageMakerClient({ region: REGION })
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

async function checkSageMaker(): Promise<ServiceState> {
  try {
    const res = await sagemakerClient.send(
      new DescribeEndpointCommand({ EndpointName: 'wave-lang-detect' })
    )
    if (res.EndpointStatus === 'InService') return 'up'
    if (res.EndpointStatus === 'Creating') return 'starting'
    if (res.EndpointStatus === 'Deleting') return 'stopping'
    return 'down'
  } catch {
    return 'not_deployed'
  }
}

async function checkBedrock(modelId: string): Promise<ServiceState> {
  try {
    const body = modelId.startsWith('anthropic')
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
    checkBedrock('anthropic.claude-3-haiku-20240307-v1:0'),
    checkBedrock('amazon.titan-embed-text-v2:0'),
    checkSageMaker(),
  ])

  const resolve = (r: PromiseSettledResult<ServiceState>): ServiceState =>
    r.status === 'fulfilled' ? r.value : 'down'

  const services = [
    { name: 'Submission Lambda', state: resolve(results[0]) },
    { name: 'Voice Lambda', state: resolve(results[1]) },
    { name: 'Bedrock Claude', state: resolve(results[2]) },
    { name: 'Bedrock Titan', state: resolve(results[3]) },
    { name: 'SageMaker', state: resolve(results[4]) },
  ]

  const upCount = services.filter((s) => s.state === 'up').length
  const startingCount = services.filter((s) => s.state === 'starting').length

  let overall: ProvisionStatus['overall'] = 'down'
  if (upCount === services.length) overall = 'ready'
  else if (upCount > 0 || startingCount > 0) overall = 'partial'
  else if (startingCount > 0) overall = 'provisioning'

  return { overall, services }
}

async function startSageMaker(): Promise<string> {
  try {
    const existing = await sagemakerClient.send(
      new DescribeEndpointCommand({ EndpointName: 'wave-lang-detect' })
    )
    if (existing.EndpointStatus === 'InService') return 'already_running'
    if (existing.EndpointStatus === 'Creating') return 'already_starting'
    return 'exists_' + (existing.EndpointStatus ?? 'unknown')
  } catch {
    // Endpoint doesn't exist — try to create it
    try {
      await sagemakerClient.send(
        new CreateEndpointCommand({
          EndpointName: 'wave-lang-detect',
          EndpointConfigName: 'wave-lang-detect-config',
        })
      )
      return 'starting'
    } catch (createErr: unknown) {
      return 'error: ' + (createErr as Error)?.message?.slice(0, 100)
    }
  }
}

async function stopSageMaker(): Promise<string> {
  try {
    await sagemakerClient.send(
      new DeleteEndpointCommand({ EndpointName: 'wave-lang-detect' })
    )
    return 'stopping'
  } catch {
    return 'not_found'
  }
}

export async function GET() {
  const status = await getStatus()
  return NextResponse.json(status)
}

export async function POST(request: NextRequest) {
  const { action } = await request.json()

  if (action === 'start') {
    const sagemakerResult = await startSageMaker()
    const status = await getStatus()
    return NextResponse.json({
      ...status,
      started_at: new Date().toISOString(),
      sagemaker_action: sagemakerResult,
    })
  }

  if (action === 'stop') {
    const sagemakerResult = await stopSageMaker()
    return NextResponse.json({
      action: 'stop',
      sagemaker: sagemakerResult,
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
