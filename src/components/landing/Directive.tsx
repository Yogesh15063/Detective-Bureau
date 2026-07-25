'use client'

import { motion } from 'framer-motion'
import { copy } from '@/lib/copy'

export function Directive() {
  const d = copy.directive
  return (
    <section id="how-it-works" className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <div className="relative border border-parchment/15 bg-charcoal">
        {/* rotated wax-seal style stamp */}
        <div className="pointer-events-none absolute -right-3 -top-4 rotate-[8deg] border-2 border-rust px-3 py-1 sm:right-6">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-rust">
            {d.stamp}
          </span>
        </div>

        <div className="border-b border-parchment/15 bg-ink px-6 py-6 sm:px-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{d.kicker}</p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-wide text-parchment sm:text-5xl">
            {d.title}
          </h2>
        </div>

        <ol className="divide-y divide-parchment/10">
          {d.clauses.map((clause, i) => (
            <motion.li
              key={clause.no}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeOut' }}
              className="flex gap-5 px-6 py-6 sm:gap-7 sm:px-10"
            >
              <span className="font-display text-3xl leading-none text-brass sm:text-4xl">
                {clause.no}
              </span>
              <div>
                <h3 className="font-mono text-sm uppercase tracking-[0.18em] text-parchment">
                  {clause.heading}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fog text-pretty sm:text-base">
                  {clause.text}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default Directive
