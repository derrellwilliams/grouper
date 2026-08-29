let measureCtx: CanvasRenderingContext2D | null | undefined

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (measureCtx !== undefined) return measureCtx
  measureCtx = typeof document === 'undefined' ? null : (document.createElement('canvas').getContext('2d') ?? null)
  return measureCtx
}

const REFERENCE_SIZE_PX = 100

/** Must match the Tailwind classes on the name rows it measures for (font-condensed font-medium). */
function nameFont(sizePx: number): string {
  return `500 ${sizePx}px "Roboto Condensed", ui-sans-serif, system-ui, sans-serif`
}

interface FitOptions {
  /** Multiple of font size reserved per line, matching the row's CSS line-height. */
  lineHeight?: number
  minSize?: number
  maxSize?: number
}

/**
 * The largest font size (px) at which every string in `texts` fits on a
 * single line within `maxWidth`, and within `maxHeight` given `lineHeight`.
 * Falls back to a height-only estimate if canvas measurement is unavailable.
 */
export function fitFontSize(texts: string[], maxWidth: number, maxHeight: number, options: FitOptions = {}): number {
  const { lineHeight = 1.5, minSize = 10, maxSize = 200 } = options
  if (maxWidth <= 0 || maxHeight <= 0) return minSize

  const sizeForHeight = maxHeight / lineHeight
  const ctx = getMeasureContext()
  if (!ctx) return Math.max(minSize, Math.min(maxSize, sizeForHeight))

  ctx.font = nameFont(REFERENCE_SIZE_PX)
  let widestAtRef = 0
  for (const text of texts) {
    const width = ctx.measureText(text || ' ').width
    if (width > widestAtRef) widestAtRef = width
  }

  const sizeForWidth = widestAtRef > 0 ? (maxWidth / widestAtRef) * REFERENCE_SIZE_PX : maxSize
  return Math.max(minSize, Math.min(maxSize, Math.min(sizeForWidth, sizeForHeight)))
}
