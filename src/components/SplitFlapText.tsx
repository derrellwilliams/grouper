import { useEffect, useRef, useState } from 'react'

const SPIN_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const STEP_MS = 70
const STAGGER_MS = 35
const NBSP = String.fromCharCode(160)

function randomSpinChar() {
  return SPIN_CHARS[Math.floor(Math.random() * SPIN_CHARS.length)]
}

interface FlapChar {
  display: string
  key: number
}

interface SplitFlapTextProps {
  text: string
  className?: string
}

/** Animates text changes character-by-character, like a split-flap
 * (train station) board: each position spins through a few random letters,
 * staggered across the string, before landing on the new character. */
export function SplitFlapText({ text, className }: SplitFlapTextProps) {
  // Starts blank (not `text`) so a freshly mounted instance flaps in its
  // first value too, instead of only animating on later prop changes.
  const [chars, setChars] = useState<FlapChar[]>(() => text.split('').map(() => ({ display: NBSP, key: 0 })))
  const charsRef = useRef(chars)
  const prevText = useRef('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    charsRef.current = chars
  }, [chars])

  useEffect(() => {
    if (text === prevText.current) return
    prevText.current = text

    timers.current.forEach(clearTimeout)
    timers.current = []

    const length = Math.max(text.length, charsRef.current.length)
    const from = Array.from({ length }, (_, i) => charsRef.current[i]?.display ?? NBSP)
    const to = Array.from({ length }, (_, i) => text[i] ?? NBSP)

    setChars((cur) => Array.from({ length }, (_, i) => cur[i] ?? { display: NBSP, key: 0 }))

    to.forEach((finalChar, i) => {
      if (finalChar === from[i]) return

      const steps = 3 + Math.floor(Math.random() * 3)
      const startDelay = i * STAGGER_MS

      for (let s = 0; s < steps; s++) {
        const isLast = s === steps - 1
        const t = setTimeout(
          () => {
            setChars((cur) => {
              const next = [...cur]
              next[i] = { display: isLast ? finalChar : randomSpinChar(), key: next[i].key + 1 }
              return next
            })
          },
          startDelay + s * STEP_MS,
        )
        timers.current.push(t)
      }
    })
  }, [text])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return (
    <span className={className}>
      {chars.map((c, i) => (
        <span key={i} className="inline-block [perspective:240px]">
          <span key={c.key} className="inline-block animate-[flap_60ms_ease-in]">
            {c.display.trim() === '' ? NBSP : c.display}
          </span>
        </span>
      ))}
    </span>
  )
}
