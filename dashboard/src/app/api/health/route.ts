import { NextResponse } from 'next/server'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { SageMakerClient, DescribeEndpointCommand } from '@aws-sdk/client-sagemaker'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

const REGION = 'us-east-1'

const lambdaClient = new LambdaClient({ region: REGION })
const sagemakerClient = new SageMakerClient({ region: REGION })
const bedrockClient = new BedrockRuntimeClient({ region: REGION })

type ServiceStatus = 'up' | 'down' | 'degraded'

async function probeLambda(functionName: string): Promise<ServiceStatus> {
  try {
    await lambdaClient.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'DryRun',
      })
    )
    return 'up'
  } catch {
    return 'down'
  }
}

async function probeSageMaker(): Promise<ServiceStatus> {
  try {
    const result = await sagemakerClient.send(
      new DescribeEndpointCommand({
        EndpointName: 'wave-lang-detect',
      })
    )
    if (result.EndpointStatus === 'InService') return 'up'
    if (result.EndpointStatus === 'Creating' || result.EndpointStatus === 'Updating')
      return 'degraded'
    return 'down'
  } catch {
    return 'down'
  }
}

async function probeBedrock(modelId: string): Promise<ServiceStatus> {
  try {
    // Minimal 1-token ping to verify model access
    const body =
      modelId.startsWith('anthropic')
        ? JSON.stringify({
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          })
        : JSON.stringify({
            inputText: 'test',
            dimensions: 256,
            normalize: true,
          })

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

export async function GET() {
  const [submission, voice, bedrockClaude, bedrockTitan, sagemaker] =
    await Promise.allSettled([
      probeLambda('wave-submission-handler'),
      probeLambda('wave-voice-handler'),
      probeBedrock('anthropic.claude-3-haiku-20240307-v1:0'),
      probeBedrock('amazon.titan-embed-text-v2:0'),
      probeSageMaker(),
    ])

  const resolve = (r: PromiseSettledResult<ServiceStatus>): ServiceStatus =>
    r.status === 'fulfilled' ? r.value : 'down'

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dashboard: 'up' as ServiceStatus,
    voice_api: resolve(voice),
    submission: resolve(submission),
    bedrock_claude: resolve(bedrockClaude),
    bedrock_titan: resolve(bedrockTitan),
    sagemaker: resolve(sagemaker),
    services: {
      dashboard: 'up' as ServiceStatus,
      voice_api: resolve(voice),
      submission: resolve(submission),
      bedrock_claude: resolve(bedrockClaude),
      bedrock_titan: resolve(bedrockTitan),
      sagemaker: resolve(sagemaker),
    },
  })
}
