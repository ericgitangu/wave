import { NextRequest, NextResponse } from 'next/server'

const VOICE_API_URL = process.env.NEXT_PUBLIC_VOICE_API_URL
  ?? 'https://96lch8ou19.execute-api.us-east-1.amazonaws.com/voice'

// Local fallback classification when AWS backend is unavailable
const SWAHILI_KEYWORDS: Record<string, string[]> = {
  check_balance: ['angalia', 'salio', 'balance', 'pesa yangu'],
  send_money: ['tuma', 'pesa', 'kutuma', 'peleka'],
  account_info: ['akaunti', 'taarifa', 'habari ya akaunti'],
  help: ['nisaidie', 'msaada', 'help'],
  greeting: ['habari', 'mambo', 'vipi', 'sasa'],
}

const ENGLISH_KEYWORDS: Record<string, string[]> = {
  check_balance: ['balance', 'check', 'how much', 'remaining'],
  send_money: ['send', 'transfer', 'pay', 'money to'],
  account_info: ['account', 'info', 'details', 'profile'],
  help: ['help', 'support', 'assist', 'problem'],
  greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
}

const RESPONSES: Record<string, Record<string, string>> = {
  en: {
    check_balance: 'Your current balance is KES 24,500. Last transaction: -KES 3,200 (transfer to John).',
    send_money: 'Ready to send money. Please specify the recipient and amount.',
    account_info: 'Account: Wave Mobile Money. Status: Active. KYC: Verified. Tier: Standard.',
    help: 'I can help you check your balance, send money, or view account info.',
    greeting: 'Welcome to Wave! How can I help you today?',
    unknown: 'I did not understand that. Try: "check balance", "send money", or "account info".',
  },
  sw: {
    check_balance: 'Salio lako ni KES 24,500. Muamala wa mwisho: -KES 3,200 (kutuma kwa John).',
    send_money: 'Tayari kutuma pesa. Tafadhali taja mpokeaji na kiasi.',
    account_info: 'Akaunti: Wave Mobile Money. Hali: Hai. KYC: Imethibitishwa.',
    help: 'Naweza kukusaidia kuangalia salio, kutuma pesa, au kuona taarifa za akaunti.',
    greeting: 'Karibu Wave! Naweza kukusaidia vipi leo?',
    unknown: 'Sikuelewa. Jaribu: "angalia salio", "tuma pesa", au "taarifa ya akaunti".',
  },
}

function localClassify(text: string): { language: string; intent: string; confidence: number; response: string } {
  const lower = text.toLowerCase().trim()

  for (const [intent, keywords] of Object.entries(SWAHILI_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { language: 'sw', intent, confidence: 0.85, response: RESPONSES.sw[intent] }
      }
    }
  }

  for (const [intent, keywords] of Object.entries(ENGLISH_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { language: 'en', intent, confidence: 0.9, response: RESPONSES.en[intent] }
      }
    }
  }

  return { language: 'en', intent: 'unknown', confidence: 0.3, response: RESPONSES.en.unknown }
}

export async function POST(request: NextRequest) {
  const start = performance.now()

  try {
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "text" field' }, { status: 400 })
    }

    // Try AWS Lambda backend first
    try {
      const res = await fetch(VOICE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(10_000),
      })

      if (res.ok) {
        const data = await res.json()
        // Lambda returns classification but no agent response — resolve it here
        const lang = (data.language === 'sw' || data.language === 'Swahili') ? 'sw' : 'en'
        const intent = data.intent ?? 'unknown'
        const response = data.response ?? RESPONSES[lang]?.[intent] ?? RESPONSES.en.unknown
        return NextResponse.json({
          ...data,
          response,
          source: 'aws_lambda',
          latency_ms: Math.round(performance.now() - start),
        })
      }
    } catch {
      // AWS backend unreachable — fall through to local classification
    }

    // Fallback: local keyword classification
    const result = localClassify(text)
    return NextResponse.json({
      ...result,
      source: 'local_fallback',
      latency_ms: Math.round(performance.now() - start),
    })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
