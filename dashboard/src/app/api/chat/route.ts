import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are an AI assistant for Eric Gitangu's Wave application. Answer questions about his experience, projects, and fit for the Senior ML Engineer (LLM & Voice) role. Be concise and specific. Use data from his resume and projects.

Background:
- 10+ years full-stack engineering (Python, Rust, TypeScript, C#, Go)
- 3 years focused AI/ML: LLMs, RAG, voice agents, sentiment analysis, GANs
- 7 years building products for African markets (Kenya, Senegal, Cote d'Ivoire)
- 13 years in the US with exposure to Silicon Valley engineering practices
- Native Swahili speaker, experienced with low-resource language challenges
- 80+ certifications (AWS, Azure, GCP, DeepLearning.AI, Meta, Stanford)
- 92 GitHub repositories
- Key projects: UniCorns (multi-tenant SaaS with M-Pesa), M-PESA Loyalty Engine (50M+ users), Resume AI Chatbot (RAG with Anthropic SDK), Afri-Voice Demo (multilingual voice agent), ElimuAI (agent orchestration), Refleckt (Rust + AI sentiment)
- Experience: Ignite Power (Senior SWE, Rwanda solar fintech), ENGIE (Senior SWE, telecom/energy), Vishnu Systems (Backend Lead, healthcare AI), Deveric Technologies (Founder)
- Stack overlap with Wave: Python, TypeScript/React, PostgreSQL, Kubernetes, event-driven architecture
- M-Pesa integration experience directly relevant to Wave mobile money
- Built production ML systems from prototype to deployment`

const FALLBACK_RESPONSE = `Eric Gitangu brings 10+ years of engineering experience with deep expertise in Python, Rust, and TypeScript. His 3 years of focused AI/ML work includes building RAG systems with the Anthropic SDK, voice agents for African languages, and production ML pipelines.

Key highlights for the Wave role:
- Built M-PESA integrations and a 50M+ user loyalty engine -- directly relevant to Wave's mobile money platform
- Native Swahili speaker with 7 years building products for African markets
- Hands-on LLM experience: RAG chatbots, agent orchestration (ElizaOS), prompt engineering
- Voice AI demo with multilingual intent classification (English/Swahili)
- Full-stack proficiency in Wave's stack: Python, TypeScript/React, PostgreSQL, Kubernetes

Feel free to ask about any specific project, skill, or experience area.`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Missing or invalid "messages" field' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      return NextResponse.json({ content: FALLBACK_RESPONSE })
    }

    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    const stream = await client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
          controller.close()
        } catch {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch {
    return NextResponse.json({ content: FALLBACK_RESPONSE })
  }
}
