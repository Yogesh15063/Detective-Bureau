'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { TypingText } from '@/components/TypingText'
import { copy } from '@/lib/copy'

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 sm:pt-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* LEFT */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.35em] text-brass">
            Investigative Division
          </p>
          <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-tight text-parchment text-balance sm:text-7xl lg:text-8xl">
            {copy.hero.headline}
          </h1>
          <p className="mt-5 font-display text-2xl uppercase tracking-[0.2em] text-rust sm:text-3xl">
            {copy.hero.tagline}
          </p>
          <p className="mt-6 max-w-md text-base leading-relaxed text-fog text-pretty">
            {copy.hero.body}
          </p>

          <div className="mt-9">
            <Link
              href={copy.hero.ctaHref}
              className="group inline-flex items-center gap-3 bg-brass px-7 py-4 font-mono text-sm uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-rust"
            >
              {copy.hero.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </motion.div>

        {/* RIGHT — opaque terminal panel with the typewriter */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="border border-parchment/10 bg-charcoal"
        >
          <div className="flex items-center justify-between border-b border-parchment/10 bg-ink px-4 py-3">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-fog">
              Intake Terminal
            </span>
            <span className="flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-brass">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brass" />
              Live
            </span>
          </div>
          <div className="min-h-40 px-5 py-6 sm:min-h-48 sm:px-6">
            <span className="font-mono text-sm text-brass">&gt; </span>
            <TypingText lines={copy.hero.typingLines} className="mt-2 text-lg leading-relaxed" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
