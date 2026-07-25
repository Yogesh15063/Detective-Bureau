'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'framer-motion'
import { RotateCcw, Search } from 'lucide-react'
import { copy } from '@/lib/copy'

type Stage = 'idle' | 'asking' | 'thinking' | 'answering' | 'done'

export function GameplayDemo() {
  const d = copy.demo
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-120px' })

  const [stage, setStage] = useState<Stage>('idle')
  const [promptChars, setPromptChars] = useState(0)
  const [answerChars, setAnswerChars] = useState(0)
  const [runId, setRunId] = useState(0)

  // kick off when scrolled into view
  useEffect(() => {
    if (inView && stage === 'idle') setStage('asking')
  }, [inView, stage])

  // state machine
  useEffect(() => {
    if (stage === 'asking') {
      if (promptChars < d.prompt.length) {
        const t = setTimeout(() => setPromptChars((c) => c + 1), 26)
        return () => clearTimeout(t)
      }
      const t = setTimeout(() => setStage('thinking'), 500)
      return () => clearTimeout(t)
    }
    if (stage === 'thinking') {
      const t = setTimeout(() => setStage('answering'), 1900)
      return () => clearTimeout(t)
    }
    if (stage === 'answering') {
      if (answerChars < d.response.length) {
        const t = setTimeout(() => setAnswerChars((c) => c + 1), 14)
        return () => clearTimeout(t)
      }
      setStage('done')
    }
  }, [stage, promptChars, answerChars, d.prompt.length, d.response.length])

  function replay() {
    setPromptChars(0)
    setAnswerChars(0)
    setStage('asking')
    setRunId((r) => r + 1)
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
      <div className="mb-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{d.kicker}</p>
        <h2 className="mt-2 font-display text-4xl uppercase tracking-wide text-parchment sm:text-5xl">
          {d.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-fog text-pretty">
          {d.subtitle}
        </p>
      </div>

      <div ref={ref} className="border border-parchment/15 bg-charcoal">
        {/* file header */}
        <div className="flex items-center justify-between border-b border-parchment/15 bg-ink px-4 py-3 sm:px-6">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fog">
            {d.caseTag}
          </span>
          <button
            onClick={replay}
            className="inline-flex items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fog transition-colors hover:text-parchment"
          >
            <RotateCcw className="h-3 w-3" />
            Re-question
          </button>
        </div>

        <div className="space-y-5 px-4 py-6 sm:px-6 sm:py-8">
          {/* Detective prompt */}
          <div className="flex justify-end">
            <div className="max-w-[85%] border border-brass bg-brass/[0.14] px-4 py-3">
              <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-brass">
                Detective
              </p>
              <p className="text-sm leading-relaxed text-parchment sm:text-base">
                {d.prompt.slice(0, promptChars)}
                {stage === 'asking' && (
                  <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.1em] animate-pulse bg-brass" />
                )}
              </p>
            </div>
          </div>

          {/* Thinking indicator */}
          <AnimatePresence>
            {stage === 'thinking' && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <span className="flex h-8 w-8 flex-none items-center justify-center border border-parchment/20 bg-ink">
                  <Search className="h-3.5 w-3.5 text-rust" />
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.16em] text-fog">
                  {d.thinking}
                </span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-rust"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* File response */}
          {(stage === 'answering' || stage === 'done') && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-[92%] border border-parchment/15 bg-charcoal-light px-4 py-3"
            >
              <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-rust">
                Case File
              </p>
              <p className="text-sm leading-relaxed text-parchment/90 text-pretty sm:text-base">
                {d.response.slice(0, answerChars)}
                {stage === 'answering' && (
                  <span className="ml-0.5 inline-block h-[1em] w-[0.5ch] translate-y-[0.1em] animate-pulse bg-rust" />
                )}
              </p>
            </motion.div>
          )}

          {/* Suggested follow-ups — proof you can keep pulling threads */}
          <AnimatePresence>
            {stage === 'done' && (
              <motion.div
                key={runId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="pt-1"
              >
                <p className="mb-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-fog">
                  Threads left to pull
                </p>
                <div className="flex flex-wrap gap-2">
                  {d.followups.map((f) => (
                    <span
                      key={f}
                      className="border border-parchment/15 bg-ink px-3 py-1.5 text-xs text-fog"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

export default GameplayDemo
