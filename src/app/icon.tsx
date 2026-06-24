import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  const imgData = readFileSync(join(process.cwd(), 'public', 'icons', 'icon-32x32.png'))
  const base64 = imgData.toString('base64')

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`data:image/png;base64,${base64}`}
        width={32}
        height={32}
        alt="INFI"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    ),
    { ...size }
  )
}
