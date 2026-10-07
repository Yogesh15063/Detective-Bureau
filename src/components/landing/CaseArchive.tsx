'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { MapPin, FileText, Gauge } from 'lucide-react'
import { copy } from '@/lib/copy'

interface RealCase {
  caseId: string
  title: string
  town: string
  isPremium: boolean
  targetEvidenceCount: number
  coverImage: string | null
}

function deriveDifficulty(targetEvidence: number): string {
  if (targetEvidence < 30) return 'Medium'
  if (targetEvidence < 60) return 'Hard'
  return 'Extreme'
}

function ClassificationStamp({ isPremium }: { isPremium: boolean }) {
  return (
    <span className="pointer-events-none absolute right-3 top-9 rotate-[-9deg] border-2 border-rust px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-rust">
      {isPremium ? 'PREMIUM' : 'OPEN ACCESS'}
    </span>
  )
}

function CaseCard({ file, index }: { file: RealCase; index: number }) {
  const difficulty = deriveDifficulty(file.targetEvidenceCount)
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Link href={`/cases/${file.caseId}`} className="group block">
        {/* folder tab */}
        <div className="ml-4 inline-block border border-b-0 border-parchment/15 bg-charcoal-light px-3 py-1">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-fog">
            No. {file.caseId}
          </span>
        </div>

        <motion.article
          whileHover={{ y: -6, rotate: -0.8 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="relative origin-bottom-left border border-parchment/15 bg-charcoal p-5 overflow-hidden"
        >
          <ClassificationStamp isPremium={file.isPremium} />

          {file.coverImage && (
            <div className="absolute inset-0 opacity-15">
              <img
                src={file.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="relative">
            <span className="inline-block border border-brass text-brass px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.2em]">
              OPEN
            </span>

            <h3 className="mt-4 font-display text-2xl uppercase leading-none tracking-wide text-parchment text-balance">
              {file.title}
            </h3>

            <dl className="mt-5 space-y-2 border-t border-parchment/10 pt-4">
              <div className="flex items-center gap-2 text-fog">
                <MapPin className="h-3.5 w-3.5 flex-none text-rust" />
                <dd className="text-xs">{file.town}</dd>
              </div>
              <div className="flex items-center gap-2 text-fog">
                <FileText className="h-3.5 w-3.5 flex-none text-rust" />
                <dd className="font-mono text-xs">{file.targetEvidenceCount} exhibits logged</dd>
              </div>
              <div className="flex items-center gap-2 text-fog">
                <Gauge className="h-3.5 w-3.5 flex-none text-rust" />
                <dd className="text-xs">{difficulty}</dd>
              </div>
            </dl>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  )
}

export function CaseArchive() {
  const a = copy.archive
  const [cases, setCases] = useState<RealCase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/cases')
      .then((res) => res.json())
      .then((data) => {
        setCases(data.cases ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section id="about" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-brass">{a.kicker}</p>
        <h2 className="mt-2 font-display text-4xl uppercase tracking-wide text-parchment sm:text-5xl">
          {a.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-fog text-pretty">{a.subtitle}</p>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-fog">Gathering the open cases...</p>
      ) : cases.length === 0 ? (
        <p className="font-mono text-sm text-fog">No files in the archive yet.</p>
      ) : (
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {cases.slice(0, 6).map((file, i) => (
            <CaseCard key={file.caseId} file={file} index={i} />
          ))}
        </div>
      )}

      <div className="mt-12">
        <Link
          href={a.ctaHref}
          className="inline-flex items-center border border-parchment/25 px-6 py-3 font-mono text-xs uppercase tracking-[0.2em] text-parchment transition-colors hover:border-brass hover:bg-brass"
        >
          {a.cta}
        </Link>
      </div>
    </section>
  )
}

export default CaseArchive