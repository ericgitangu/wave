import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/crypto'

const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'wave-voice-default-key'

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
    check_balance: 'Your current balance is 15,320 XOF. Last transaction: -2,500 XOF (transfer to Amadou).',
    send_money: 'Ready to send money. Please specify the recipient and amount.',
    account_info: 'Account: Wave Mobile Money. Status: Active. KYC: Verified. Tier: Standard.',
    help: 'I can help you check your balance, send money, or view account info. What would you like to do?',
    greeting: 'Welcome to Wave! How can I help you today?',
    unknown: 'I did not understand that. Try: "check balance", "send money", or "account info".',
  },
  sw: {
    check_balance: 'Salio lako ni 15,320 XOF. Muamala wa mwisho: -2,500 XOF (kutuma kwa Amadou).',
    send_money: 'Tayari kutuma pesa. Tafadhali taja mpokeaji na kiasi.',
    account_info: 'Akaunti: Wave Mobile Money. Hali: Hai. KYC: Imethibitishwa. Kiwango: Kawaida.',
    help: 'Naweza kukusaidia kuangalia salio, kutuma pesa, au kuona taarifa za akaunti. Unahitaji nini?',
    greeting: 'Karibu Wave! Naweza kukusaidia vipi leo?',
    unknown: 'Sikuelewa. Jaribu: "angalia salio", "tuma pesa", au "taarifa ya akaunti".',
  },
}

function classify(text: string): { language: string; intent: string; confidence: number } {
  const lower = text.toLowerCase().trim()

  // Check Swahili first
  for (const [intent, keywords] of Object.entries(SWAHILI_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { language: 'sw', intent, confidence: 0.85 }
      }
    }
  }

  // Then English
  for (const [intent, keywords] of Object.entries(ENGLISH_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { language: 'en', intent, confidence: 0.9 }
      }
    }
  }

  return { language: 'en', intent: 'unknown', confidence: 0.3 }
}

export async function POST(request: NextRequest) {
  const start = performance.now()

  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "text" field' },
        { status: 400 }
      )
    }

    const { language, intent, confidence } = classify(text)
    const latency_ms = Math.round(performance.now() - start)
    const response = RESPONSES[language]?.[intent] ?? RESPONSES['en']['unknown']

    const result = { language, intent, confidence, latency_ms, response }
    const encrypted = await encrypt(JSON.stringify(result), ENCRYPTION_KEY)

    return NextResponse.json({
      ...result,
      _encrypted: encrypted,
    })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
