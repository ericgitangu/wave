import { NextRequest, NextResponse } from 'next/server'
import { encrypt } from '@/lib/crypto'

const ENCRYPTION_KEY = process.env.API_ENCRYPTION_KEY || 'wave-voice-default-key'

const FRENCH_KEYWORDS: Record<string, string[]> = {
  check_balance: ['solde', 'combien', 'reste', 'vérifier', 'consulter'],
  send_money: ['envoyer', 'transférer', 'payer', 'argent'],
  account_info: ['compte', 'informations', 'profil', 'détails'],
  help: ['aide', 'aidez', 'problème', 'assistance'],
  greeting: ['bonjour', 'salut', 'bonsoir', 'coucou'],
}

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
  fr: {
    check_balance: 'Votre solde actuel est de 15 320 XOF. Dernière transaction : -2 500 XOF (transfert à Amadou).',
    send_money: 'Prêt à envoyer de l\'argent. Veuillez préciser le destinataire et le montant.',
    account_info: 'Compte : Wave Mobile Money. Statut : Actif. KYC : Vérifié. Niveau : Standard.',
    help: 'Je peux vous aider à vérifier votre solde, envoyer de l\'argent ou consulter vos informations de compte.',
    greeting: 'Bienvenue sur Wave ! Comment puis-je vous aider ?',
    unknown: 'Je n\'ai pas compris. Essayez : « consulter solde », « envoyer argent » ou « informations compte ».',
  },
  en: {
    check_balance: 'Your current balance is KES 24,500. Last transaction: -KES 3,200 (transfer to John).',
    send_money: 'Ready to send money. Please specify the recipient and amount.',
    account_info: 'Account: Wave Mobile Money. Status: Active. KYC: Verified. Tier: Standard.',
    help: 'I can help you check your balance, send money, or view account info. What would you like to do?',
    greeting: 'Welcome to Wave! How can I help you today?',
    unknown: 'I did not understand that. Try: "check balance", "send money", or "account info".',
  },
  sw: {
    check_balance: 'Salio lako ni KES 24,500. Muamala wa mwisho: -KES 3,200 (kutuma kwa John).',
    send_money: 'Tayari kutuma pesa. Tafadhali taja mpokeaji na kiasi.',
    account_info: 'Akaunti: Wave Mobile Money. Hali: Hai. KYC: Imethibitishwa. Kiwango: Kawaida.',
    help: 'Naweza kukusaidia kuangalia salio, kutuma pesa, au kuona taarifa za akaunti. Unahitaji nini?',
    greeting: 'Karibu Wave! Naweza kukusaidia vipi leo?',
    unknown: 'Sikuelewa. Jaribu: "angalia salio", "tuma pesa", au "taarifa ya akaunti".',
  },
}

function classify(text: string): { language: string; intent: string; confidence: number } {
  const lower = text.toLowerCase().trim()

  // Check French first (Wave's primary Senegal market)
  for (const [intent, keywords] of Object.entries(FRENCH_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return { language: 'fr', intent, confidence: 0.88 }
      }
    }
  }

  // Check Swahili (East African markets)
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
