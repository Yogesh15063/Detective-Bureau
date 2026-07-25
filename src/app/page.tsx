
import SceneBackground from '@/components/SceneBackground'
import { Header } from '@/components/landing/Header'
import { Hero } from '@/components/landing/Hero'
import { Directive } from '@/components/landing/Directive'
import { GameplayDemo } from '@/components/landing/GameplayDemo'
import { CaseArchive } from '@/components/landing/CaseArchive'
import { FinalCta } from '@/components/landing/FinalCta'

export default function Page() {
  return (
    <>
      {/* Fixed, scroll-driven photo background lives at z-0 behind everything.
          Keep your existing <SceneBackground /> — this import is a placeholder. */}
      <SceneBackground />

      {/* All page content sits above the background */}
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Directive />
          <GameplayDemo />
          <CaseArchive />
          <FinalCta />
        </main>
      </div>
    </>
  )
}
