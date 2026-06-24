import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const imgData = readFileSync(join(process.cwd(), 'public', 'icons', 'apple-touch-icon.png'))
  const base64 = imgData.toString('base64')

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:image/png;base64,${base64}`}
        width={180}
        height={180}
        alt="INFI"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ),
    { ...size }
  )
}
