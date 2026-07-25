'use client'

import { useEffect, useState } from 'react'

type TypingTextProps = {
  lines: string[]
  typingSpeed?: number
  holdDuration?: number
  className?: string
}

/**
 * Lightweight typewriter that cycles through `lines`.
 * Placeholder implementation — swap with your production component;
 * the API (a `lines: string[]` prop) is preserved.
 */
export function TypingText({
  lines,
  typingSpeed = 42,
  holdDuration = 1600,
  className,
}: TypingTextProps) {
  const [lineIndex, setLineIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [phase, setPhase] = useState<'typing' | 'holding' | 'deleting'>('typing')

  useEffect(() => {
    if (lines.length === 0) return
    const current = lines[lineIndex % lines.length]

    if (phase === 'typing') {
      if (charCount < current.length) {
        const t = setTimeout(() => setCharCount((c) => c + 1), typingSpeed)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setPhase('holding'), holdDuration)
      return () => clearTimeout(t)
    }

    if (phase === 'holding') {
      const t = setTimeout(() => setPhase('deleting'), holdDuration)
      return () => clearTimeout(t)
    }

    // deleting
    if (charCount > 0) {
      const t = setTimeout(() => setCharCount((c) => c - 1), typingSpeed / 2)
      return () => clearTimeout(t)
    }
    setPhase('typing')
    setLineIndex((i) => (i + 1) % lines.length)
  }, [charCount, phase, lineIndex, lines, typingSpeed, holdDuration])

  const current = lines.length ? lines[lineIndex % lines.length] : ''

  return (
    <div className={className} aria-live="polite">
      <span className="font-mono text-parchment">{current.slice(0, charCount)}</span>
      <span className="ml-0.5 inline-block h-[1.1em] w-[0.5ch] translate-y-[0.15em] animate-pulse bg-brass align-middle" />
    </div>
  )
}

export default TypingText
