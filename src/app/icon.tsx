import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 14,
          fontWeight: 900,
          letterSpacing: '-0.5px',
          background: '#1e1b4b',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          borderRadius: '4px',
        }}
      >
        IN
      </div>
    ),
    {
      ...size,
    }
  )
}
