import { ImageResponse } from 'next/og'

export const alt = 'Eric Gitangu | Wave Application'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1a56db 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #1a56db 0%, #7c3aed 100%)',
              borderRadius: '16px',
            }}
          >
            <span style={{ fontSize: '36px', fontWeight: 700, color: '#ffffff' }}>
              W
            </span>
          </div>
        </div>
        <h1
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Eric Gitangu | Wave
        </h1>
        <p
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            margin: '12px 0 0 0',
          }}
        >
          Senior ML Engineer -- LLM &amp; Voice
        </p>
        <p
          style={{
            fontSize: '18px',
            color: '#64748b',
            margin: '32px 0 0 0',
          }}
        >
          wave-apply.ericgitangu.com
        </p>
      </div>
    ),
    { ...size }
  )
}
