import { NextRequest, NextResponse } from 'next/server'

const VOICE_API_URL = process.env.NEXT_PUBLIC_VOICE_API_URL
  ?? 'https://96lch8ou19.execute-api.us-east-1.amazonaws.com/voice'

// Unified multi-language keyword map — 10 languages across Wave's African markets
const LANG_KEYWORDS: Record<string, { keywords: string[]; intents: Record<string, string[]> }> = {
  sw: {
    keywords: ['habari', 'mambo', 'vipi', 'sasa', 'karibu', 'asante', 'tafadhali', 'ndio', 'hapana', 'salio', 'akaunti'],
    intents: {
      check_balance: ['angalia', 'salio', 'pesa yangu', 'kiasi'],
      send_money: ['tuma', 'kutuma', 'peleka', 'tuma pesa'],
      account_info: ['akaunti', 'taarifa', 'habari ya akaunti'],
      help: ['nisaidie', 'msaada'],
      greeting: ['habari', 'mambo', 'vipi', 'sasa', 'karibu'],
    },
  },
  en: {
    keywords: ['the', 'my', 'please', 'want', 'need', 'can', 'how', 'what', 'check', 'show'],
    intents: {
      check_balance: ['balance', 'check', 'how much', 'remaining'],
      send_money: ['send', 'transfer', 'pay', 'money to'],
      account_info: ['account', 'info', 'details', 'profile'],
      help: ['help', 'support', 'assist', 'problem'],
      greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
    },
  },
  fr: {
    keywords: ['je', 'mon', 'ma', 'mes', 'le', 'la', 'les', 'du', 'des', 'est', 'une', 'que', 'solde', 'argent', 'compte', "l'argent"],
    intents: {
      check_balance: ['solde', 'consulter', 'combien', 'reste'],
      send_money: ['envoyer', 'argent', 'transfert', 'virement', "envoyer de l'argent"],
      account_info: ['compte', 'informations', 'profil', 'details du compte'],
      help: ['aidez', 'aide', 'probleme', 'assistance'],
      greeting: ['bonjour', 'salut', 'bonsoir', 'coucou'],
    },
  },
  wo: {
    keywords: ['naa', 'sama', 'yow', 'mangi', 'dinga', 'waxal', 'jere', 'nekk', 'def'],
    intents: {
      check_balance: ['beegam', 'xaalis', 'sama wàllu', 'natta'],
      send_money: ['yonnee', 'xaalis', 'wàcce', 'yonnee xaalis'],
      account_info: ['sama kont', 'xibaar', 'informasioon'],
      help: ['ndimbali', 'wallum', 'jappale'],
      greeting: ['nanga def', 'salaam aleekum', 'na nga def', 'jaam nga am'],
    },
  },
  ha: {
    keywords: ['ina', 'na', 'kudi', 'nawa', 'yaya', 'mene', 'wane', 'kuma', 'bayan'],
    intents: {
      check_balance: ['duba', 'kudin', 'balance', 'nawa kudin'],
      send_money: ['aika', 'kudi', 'tura', 'aika kudi'],
      account_info: ['asusu', 'bayani', 'bayanin asusu'],
      help: ['taimako', 'taimaka', 'matsala'],
      greeting: ['sannu', 'barka', 'ina kwana', 'ina wuni'],
    },
  },
  yo: {
    keywords: ['mi', 'emi', 'owo', 'ranse', 'wo', 'iranlowo', 'akanti'],
    intents: {
      check_balance: ['wo iye', 'owo mi', 'balance', 'seku'],
      send_money: ['ranse', 'fi owo', 'gbese', 'ranse owo'],
      account_info: ['akanti', 'alaye', 'iroyin akanti'],
      help: ['iranlowo', 'ran mi lowo'],
      greeting: ['bawo ni', 'e karo', 'e kaale', 'pele o'],
    },
  },
  am: {
    keywords: ['እኔ', 'የኔ', 'ገንዘብ', 'ሂሳብ', 'ላክ', 'ስንት', 'እባክ'],
    intents: {
      check_balance: ['ቀሪ', 'ሂሳብ', 'ስንት', 'ቀሪ ሂሳብ'],
      send_money: ['ላክ', 'ገንዘብ', 'አስተላልፍ', 'ገንዘብ ላክ'],
      account_info: ['መለያ', 'ሂሳብ', 'የመለያ መረጃ'],
      help: ['እርዳታ', 'እገዛ', 'ችግር'],
      greeting: ['ሰላም', 'እንደምን', 'ታዲያስ', 'ሰላም ነው'],
    },
  },
  lg: {
    keywords: ['nze', 'yange', 'ssente', 'akawunti', 'weereza', 'meka'],
    intents: {
      check_balance: ['kebera', 'ssente', 'balance', 'ssente zange'],
      send_money: ['weereza', 'ssente', 'senda', 'weereza ssente'],
      account_info: ['akawunti', 'ebikwata', 'akawunti yange'],
      help: ['yamba', 'obuyambi', 'buzibu'],
      greeting: ['ki kati', 'wasuze otya', 'gyendi', 'oli otya'],
    },
  },
  pt: {
    keywords: ['meu', 'minha', 'dinheiro', 'conta', 'enviar', 'quanto', 'por favor', 'saldo'],
    intents: {
      check_balance: ['saldo', 'consultar', 'quanto', 'verificar saldo'],
      send_money: ['enviar', 'dinheiro', 'transferir', 'enviar dinheiro'],
      account_info: ['conta', 'informacoes', 'perfil', 'dados da conta'],
      help: ['ajuda', 'ajudar', 'problema', 'socorro'],
      greeting: ['ola', 'bom dia', 'boa tarde', 'boa noite'],
    },
  },
  ar: {
    keywords: ['أنا', 'حسابي', 'المال', 'أرسل', 'كم', 'من فضلك', 'رصيد'],
    intents: {
      check_balance: ['رصيد', 'كم', 'حساب', 'رصيدي'],
      send_money: ['أرسل', 'حوالة', 'تحويل', 'أرسل المال'],
      account_info: ['حساب', 'معلومات', 'بيانات الحساب'],
      help: ['مساعدة', 'ساعدني', 'مشكلة'],
      greeting: ['مرحبا', 'السلام عليكم', 'صباح الخير', 'أهلا'],
    },
  },
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
  fr: {
    check_balance: 'Votre solde actuel est de XOF 125,000. Dernière transaction : -XOF 15,000 (transfert à Amadou).',
    send_money: "Prêt à envoyer de l'argent. Veuillez indiquer le destinataire et le montant.",
    account_info: 'Compte : Wave Mobile Money. Statut : Actif. KYC : Vérifié. Niveau : Standard.',
    help: "Je peux vous aider à consulter votre solde, envoyer de l'argent ou voir les infos du compte.",
    greeting: 'Bienvenue sur Wave ! Comment puis-je vous aider ?',
    unknown: 'Je n\'ai pas compris. Essayez : "consulter solde", "envoyer argent" ou "infos compte".',
  },
  wo: {
    check_balance: 'Sa wàllu mooy XOF 125,000. Transfert gu mujj: -XOF 15,000 (yonnee Amadou).',
    send_money: 'Danga am sañ-sañ yonnee xaalis. Waxal kan ngay yonnee ak natta.',
    account_info: 'Kont: Wave Mobile Money. Doxin: Aktif. KYC: Dëgg na.',
    help: 'Manaa la ndimbali beega sa wàllu, yonnee xaalis walla xool sa kont.',
    greeting: 'Dalal jamm ci Wave! Nan la ndimbali tey?',
    unknown: 'Dégguma. Jéema: "beegam sama wàllu", "yonnee xaalis" walla "sama kont".',
  },
  ha: {
    check_balance: 'Kudin ka yanzu shine NGN 450,000. Cinikin karshe: -NGN 52,000 (aika zuwa Musa).',
    send_money: 'An shirya aika kudi. Da fatan za a bayyana mai karba da adadin.',
    account_info: 'Asusu: Wave Mobile Money. Matsayi: Yana aiki. KYC: An tabbatar.',
    help: 'Zan iya taimaka ka duba kudin ka, aika kudi, ko ganin bayanin asusu.',
    greeting: 'Barka da zuwa Wave! Yaya zan taimaka?',
    unknown: 'Ban fahimta ba. Gwada: "duba kudin", "aika kudi" ko "bayanin asusu".',
  },
  yo: {
    check_balance: 'Iye owo re lọwọlọwọ jẹ NGN 450,000. Idunadura to kẹhin: -NGN 52,000 (ranse si Bola).',
    send_money: 'Setan lati ranse owo. Jọwọ sọ ẹni ti yoo gba ati iye owo.',
    account_info: 'Akanti: Wave Mobile Money. Ipo: Nṣiṣẹ. KYC: Ti fidi mulẹ.',
    help: 'Mo le ran ọ lọwọ lati wo iye owo rẹ, ranse owo, tabi wo alaye akanti.',
    greeting: 'Kaabo si Wave! Bawo ni mo ṣe le ran ọ lọwọ?',
    unknown: 'Mi o ye mi. Gbiyanju: "wo iye owo mi", "ranse owo" tabi "alaye akanti".',
  },
  am: {
    check_balance: 'የአሁኑ ቀሪ ሂሳብዎ ETB 85,000 ነው። የመጨረሻ ግብይት: -ETB 12,000 (ወደ ከበደ ላክ)።',
    send_money: 'ገንዘብ ለመላክ ዝግጁ ነው። እባክዎ ተቀባዩን እና መጠኑን ያሳውቁ።',
    account_info: 'መለያ: Wave Mobile Money. ሁኔታ: ንቁ. KYC: ተረጋግጧል።',
    help: 'ቀሪ ሂሳብዎን ለማየት፣ ገንዘብ ለመላክ ወይም የመለያ መረጃ ለማየት ልረዳዎ እችላለሁ።',
    greeting: 'እንኳን ወደ Wave በደህና መጡ! እንዴት ልርዳዎ?',
    unknown: 'ይቅርታ አልገባኝም። ይሞክሩ: "ቀሪ ሂሳብ"፣ "ገንዘብ ላክ" ወይም "የመለያ መረጃ"።',
  },
  lg: {
    check_balance: 'Ssente zo kati kwe UGX 2,500,000. Entambula ey\'asembyeyo: -UGX 350,000 (yaweerezebwa Nakato).',
    send_money: 'Twetegefu okuweereza ssente. Bambi laga ani agenda okufuna ne omuwendo.',
    account_info: 'Akawunti: Wave Mobile Money. Embeera: Nkolagana. KYC: Ekakasiddwa.',
    help: 'Nsobola okukuyamba okukebera ssente zo, okuweereza ssente, oba okulaba ebikwata ku akawunti yo.',
    greeting: 'Tukusanyuse ku Wave! Nkuyambe ntya leero?',
    unknown: 'Sitegedde. Gezaako: "kebera ssente", "weereza ssente" oba "akawunti yange".',
  },
  pt: {
    check_balance: 'O seu saldo atual é MZN 75,000. Última transação: -MZN 8,500 (transferência para João).',
    send_money: 'Pronto para enviar dinheiro. Por favor indique o destinatário e o montante.',
    account_info: 'Conta: Wave Mobile Money. Estado: Ativa. KYC: Verificado. Nível: Padrão.',
    help: 'Posso ajudá-lo a consultar o saldo, enviar dinheiro ou ver informações da conta.',
    greeting: 'Bem-vindo ao Wave! Como posso ajudá-lo?',
    unknown: 'Não entendi. Tente: "consultar saldo", "enviar dinheiro" ou "informações da conta".',
  },
  ar: {
    check_balance: 'رصيدك الحالي هو MAD 12,500. آخر معاملة: -MAD 1,800 (تحويل إلى أحمد).',
    send_money: 'جاهز لإرسال المال. يرجى تحديد المستلم والمبلغ.',
    account_info: 'الحساب: Wave Mobile Money. الحالة: نشط. KYC: تم التحقق.',
    help: 'يمكنني مساعدتك في التحقق من رصيدك أو إرسال المال أو عرض معلومات الحساب.',
    greeting: 'مرحباً بك في Wave! كيف يمكنني مساعدتك؟',
    unknown: 'لم أفهم. جرب: "رصيدي"، "أرسل المال" أو "معلومات الحساب".',
  },
}

// Normalize Lambda language names to ISO codes
function normalizeLangCode(lang: string): string {
  const map: Record<string, string> = {
    swahili: 'sw',
    english: 'en',
    french: 'fr',
    wolof: 'wo',
    hausa: 'ha',
    yoruba: 'yo',
    amharic: 'am',
    luganda: 'lg',
    portuguese: 'pt',
    arabic: 'ar',
  }
  return map[lang.toLowerCase()] ?? lang
}

function localClassify(text: string): { language: string; intent: string; confidence: number; response: string } {
  const lower = text.toLowerCase().trim()

  // Score each language by counting keyword matches
  let bestLang = 'en'
  let bestIntent = 'unknown'
  let bestScore = 0

  for (const [lang, { keywords, intents }] of Object.entries(LANG_KEYWORDS)) {
    // Check intent keywords first (higher priority)
    for (const [intent, kws] of Object.entries(intents)) {
      for (const kw of kws) {
        if (lower.includes(kw)) {
          // Weight: intent keyword match = 2, language keyword match bonus
          const langBonus = keywords.filter(k => lower.includes(k)).length
          const score = 2 + langBonus
          if (score > bestScore) {
            bestScore = score
            bestLang = lang
            bestIntent = intent
          }
        }
      }
    }

    // Check general language keywords if no intent matched yet for this lang
    if (bestLang !== lang) {
      const langScore = keywords.filter(k => lower.includes(k)).length
      if (langScore > bestScore) {
        bestScore = langScore
        bestLang = lang
        bestIntent = 'unknown'
      }
    }
  }

  const confidence = bestScore > 0 ? Math.min(0.95, 0.6 + bestScore * 0.08) : 0.3
  const response = RESPONSES[bestLang]?.[bestIntent] ?? RESPONSES.en.unknown

  return { language: bestLang, intent: bestIntent, confidence, response }
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
        // Lambda returns binary swahili/english — enrich with full language detection
        const lambdaLang = normalizeLangCode(data.language ?? 'en')
        // Re-classify locally to detect the actual language (Lambda only knows sw/en)
        const local = localClassify(text)
        // Use local detection if it found a non-en/sw language, otherwise trust Lambda
        const lang = (local.language !== 'en' && local.language !== 'sw') ? local.language : lambdaLang
        const intent = data.intent ?? local.intent
        const response = RESPONSES[lang]?.[intent] ?? RESPONSES.en.unknown
        return NextResponse.json({
          ...data,
          language: lang,
          intent,
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
