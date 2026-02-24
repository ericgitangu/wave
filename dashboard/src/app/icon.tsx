import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a56db 0%, #7c3aed 100%)',
          borderRadius: '6px',
        }}
      >
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1,
          }}
        >
          W
        </span>
      </div>
    ),
    { ...size }
  )
}
