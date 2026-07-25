'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { copy } from '@/lib/copy'

export function FinalCta() {
  const c = copy.finalCta
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="border border-parchment/15 bg-charcoal px-6 py-14 text-center sm:px-12"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{c.kicker}</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-5xl uppercase leading-[0.95] tracking-wide text-parchment text-balance sm:text-6xl">
          {c.title}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-fog text-pretty">
          {c.body}
        </p>
        <div className="mt-9">
          <Link
            href={c.ctaHref}
            className="group inline-flex items-center gap-3 bg-brass px-8 py-4 font-mono text-sm uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-rust"
          >
            {c.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </motion.div>

      <div className="mt-16 flex flex-col items-center gap-1 border-t border-parchment/10 pt-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-fog">
          {copy.footer.line}
        </p>
        <p className="text-xs text-fog/70">{copy.footer.note}</p>
      </div>
    </section>
  )
}

export default FinalCta
