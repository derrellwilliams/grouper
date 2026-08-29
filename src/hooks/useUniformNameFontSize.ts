import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { fitFontSize } from '@/lib/fitText'

const CARD_CONTENT_PADDING_X_PX = 32 // matches GroupCard's CardContent `px-8`
const ROW_GAP_PX = 8 // matches GroupCard's CardContent `gap-2`
const NAME_LINE_HEIGHT = 1.5 // matches the name row's inline line-height
const MIN_FONT_PX = 10
const MAX_FONT_PX = 40
const FALLBACK_FONT_PX = 24

/**
 * Computes one font size (px) for every group-member name, sized so the
 * longest name in the tightest card fits without being cut off — then
 * shared across every card so all names render at the same size, rather
 * than each card sizing independently.
 */
export function useUniformNameFontSize(groupNames: string[][] | null) {
  const [fontSizePx, setFontSizePx] = useState(FALLBACK_FONT_PX)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const recompute = useCallback(() => {
    if (!groupNames) return
    let minSize = Infinity

    groupNames.forEach((names, i) => {
      const el = cardRefs.current[i]
      if (!el || names.length === 0) return

      const availableWidth = el.clientWidth - CARD_CONTENT_PADDING_X_PX * 2
      const availableHeight = el.clientHeight - (names.length - 1) * ROW_GAP_PX
      const perRowHeight = availableHeight / names.length

      const size = fitFontSize(names, availableWidth, perRowHeight, {
        lineHeight: NAME_LINE_HEIGHT,
        minSize: MIN_FONT_PX,
        maxSize: MAX_FONT_PX,
      })
      if (size < minSize) minSize = size
    })

    if (Number.isFinite(minSize)) setFontSizePx(minSize)
  }, [groupNames])

  useLayoutEffect(() => {
    recompute()
  }, [recompute])

  useLayoutEffect(() => {
    const els = cardRefs.current.filter((el): el is HTMLDivElement => el !== null)
    if (els.length === 0) return

    const observer = new ResizeObserver(() => recompute())
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [groupNames, recompute])

  useLayoutEffect(() => {
    // Canvas text measurement uses a fallback font until the real one loads,
    // which can under- or overshoot the fit — recheck once it's ready.
    document.fonts?.ready.then(recompute).catch(() => {})
  }, [recompute])

  const registerCard = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      cardRefs.current[index] = el
    },
    [],
  )

  return { fontSizePx, registerCard }
}
