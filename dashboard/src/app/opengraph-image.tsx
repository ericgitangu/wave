import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const runtime = 'nodejs'
export const alt = 'Wave Application — Eric Gitangu, Senior ML Engineer'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const publicDir = join(process.cwd(), 'public')

  const [profileBuf, logoBuf] = await Promise.all([
    readFile(join(publicDir, 'eric-profile.png')),
    readFile(join(publicDir, 'wave-logo.png')),
  ])

  const profileSrc = `data:image/png;base64,${profileBuf.toString('base64')}`
  const logoSrc = `data:image/png;base64,${logoBuf.toString('base64')}`

  const chips = [
    'LLM & Voice AI',
    'Rust + PyO3',
    'Afri-Voice Demo',
    'JD Alignment',
    'AWS CDK Infra',
    'Built for Africa',
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          padding: '60px',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle glow */}
        <div
          style={{
            position: 'absolute',
            top: -100,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          }}
        />

        {/* Left content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            gap: 16,
          }}
        >
          {/* Wave logo + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={logoSrc}
              alt="Wave logo"
              width={100}
              height={44}
              style={{ objectFit: 'contain' }}
            />
            <span
              style={{
                color: 'rgba(148,163,184,0.9)',
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
              }}
            >
              Wave Application
            </span>
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: '#f1f5f9',
              lineHeight: 1.1,
            }}
          >
            Eric Gitangu
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: '#60a5fa',
            }}
          >
            Senior ML Engineer — LLM & Voice
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 16,
              color: 'rgba(148,163,184,0.7)',
              maxWidth: 500,
              lineHeight: 1.5,
            }}
          >
            Rust+Python submission pipeline, Afri-Voice multilingual agent, JD
            alignment matrix, and support automation architecture.
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {chips.map((label) => (
              <div
                key={label}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: '1px solid rgba(59,130,246,0.25)',
                  background: 'rgba(59,130,246,0.08)',
                  color: '#93c5fd',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* URL */}
          <div
            style={{
              fontSize: 14,
              color: 'rgba(148,163,184,0.5)',
              marginTop: 12,
            }}
          >
            wave-apply.ericgitangu.com
          </div>
        </div>

        {/* Right — profile photo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 280,
          }}
        >
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: '50%',
              border: '3px solid rgba(59,130,246,0.4)',
              boxShadow: '0 0 60px rgba(59,130,246,0.15)',
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <img
              src={profileSrc}
              alt="Eric Gitangu"
              width={240}
              height={240}
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
