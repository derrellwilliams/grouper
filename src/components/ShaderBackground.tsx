import { Dithering } from '@paper-design/shaders-react'

/**
 * Full-bleed animated background. colorBack is transparent so the page's
 * own solid --background shows behind the dither pattern rather than the
 * shader painting its own opaque backdrop.
 */
export function ShaderBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <Dithering
        style={{ width: '100%', height: '100%' }}
        colorBack="#00000000"
        colorFront="#282d2f"
        shape="swirl"
        type="8x8"
        size={2}
        speed={0.4}
      />
    </div>
  )
}
