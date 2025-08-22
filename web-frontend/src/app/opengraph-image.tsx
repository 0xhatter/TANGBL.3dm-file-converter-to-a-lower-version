import { ImageResponse } from 'next/og'

export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpengraphImage() {
  const title = 'Convert Rhino .3dm to Lower Versions — TANGBL'
  const subtitle = 'Downsave Rhino 8 → 7/6/5/4/3/2 online'
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #000000 0%, #0b0b0b 40%, #101010 100%)',
          color: 'white',
          fontFamily: 'Inter, ui-sans-serif, system-ui',
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            letterSpacing: -1,
            textAlign: 'center',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 34,
            opacity: 0.9,
          }}
        >
          {subtitle}
        </div>
        <div style={{ position: 'absolute', top: 30, left: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" stroke="#ffffff" strokeWidth="1.6"/>
          </svg>
          <span style={{ fontSize: 28, fontWeight: 700 }}>TANGBL</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
