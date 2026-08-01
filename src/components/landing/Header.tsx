'use client'

import Link from 'next/link'
import { copy } from '@/lib/copy'
import AuthNav from '@/components/AuthNav'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-parchment/10 bg-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border border-brass bg-brass font-display text-lg leading-none text-parchment">
            {copy.brand.mark}
          </span>
          <span className="font-display text-2xl uppercase leading-none tracking-wide text-parchment">
            {copy.brand.wordmark}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/cases"
            className="font-mono text-xs uppercase tracking-[0.18em] text-fog transition-colors hover:text-parchment"
          >
            {copy.nav.cases}
          </Link>
          <Link
            href="#how-it-works"
            className="font-mono text-xs uppercase tracking-[0.18em] text-fog transition-colors hover:text-parchment"
          >
            {copy.nav.how}
          </Link>
          <Link
            href="#about"
            className="font-mono text-xs uppercase tracking-[0.18em] text-fog transition-colors hover:text-parchment"
          >
            {copy.nav.about}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <AuthNav />
          <Link
            href={copy.hero.ctaHref}
            className="border border-brass px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-parchment transition-colors hover:bg-brass"
          >
            {copy.nav.enter}
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header