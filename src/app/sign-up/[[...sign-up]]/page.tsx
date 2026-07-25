import Link from "next/link";
import {
  Search,
  Coffee,
  Radio,
  MapPin,
  Camera,
  FileText,
  Fingerprint,
} from "lucide-react";
import { copy } from "@/lib/copy";

const sampleCases = [
  {
    number: "GH-1979R-2025",
    title: "The Beacon Goes Dark",
    town: "Grey Harbor",
    incident: "Oct 1979 / reopened 2025",
    clues: 61,
    difficulty: "Medium",
    classification: "RESTRICTED",
    status: "OPEN",
  },
  {
    number: "AH-0447-2025",
    title: "Ashgrove Hollow",
    town: "Ashgrove",
    incident: "Apr 2024",
    clues: 72,
    difficulty: "Hard",
    classification: "CONFIDENTIAL",
    status: "OPEN",
  },
  {
    number: "R614-1103-2025",
    title: "Room 614",
    town: "Undisclosed",
    incident: "Nov 2025",
    clues: 49,
    difficulty: "Extreme",
    classification: "EYES ONLY",
    status: "ARCHIVED",
  },
];

function DeskScene() {
  return (
    <div className="relative w-full h-full min-h-[420px] rounded-lg border border-white/10 bg-charcoal overflow-hidden">
      <div
        className="absolute -top-24 right-10 w-72 h-72 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, #c89b4b, transparent 70%)" }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.12]"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path d="M20 60 H380 M20 140 H380 M20 220 H380 M20 300 H380" stroke="#EDE7DA" strokeWidth="0.5" />
        <path d="M80 20 V380 M180 20 V380 M280 20 V380" stroke="#EDE7DA" strokeWidth="0.5" />
        <circle cx="180" cy="140" r="4" fill="#C89B4B" />
        <circle cx="280" cy="220" r="4" fill="#C89B4B" />
        <path d="M180 140 L280 220" stroke="#C89B4B" strokeWidth="1" strokeDasharray="3 3" />
      </svg>

      <div className="absolute top-10 left-8 w-24 h-28 bg-parchment/95 rounded-sm shadow-lg -rotate-6 border border-black/10 p-1.5">
        <div className="w-full h-full bg-ink/80 rounded-[1px] flex items-center justify-center">
          <Camera className="w-6 h-6 text-fog" strokeWidth={1.25} aria-hidden />
        </div>
      </div>
      <div className="absolute top-24 left-28 w-20 h-24 bg-parchment/95 rounded-sm shadow-lg rotate-3 border border-black/10 p-1.5">
        <div className="w-full h-full bg-ink/80 rounded-[1px] flex items-center justify-center">
          <Fingerprint className="w-6 h-6 text-fog" strokeWidth={1.25} aria-hidden />
        </div>
      </div>

      <div className="absolute bottom-24 left-10 w-32 h-20 bg-parchment/90 rounded-sm shadow-lg rotate-2 border border-black/10 p-2">
        <div className="w-full h-1 bg-ink/20 mb-1" />
        <div className="w-3/4 h-1 bg-ink/20 mb-1" />
        <div className="w-full h-1 bg-ink/20 mb-1" />
        <div className="w-1/2 h-1 bg-ink/20" />
      </div>

      <div className="absolute bottom-16 right-16 -rotate-12">
        <Search className="w-14 h-14 text-brass/70" strokeWidth={1} aria-hidden />
      </div>

      <div className="absolute bottom-10 left-44 w-10 h-10 rounded-full border-2 border-brass/20" />
      <Coffee className="absolute bottom-9 left-[9.5rem] w-6 h-6 text-fog/50 -rotate-6" strokeWidth={1.25} aria-hidden />

      <Radio className="absolute top-14 right-14 w-9 h-9 text-fog/40" strokeWidth={1.25} aria-hidden />

      <div className="absolute bottom-32 right-10 flex items-center gap-1 text-[10px] font-mono text-brass/70 rotate-3">
        <MapPin className="w-3 h-3" aria-hidden />
        41.2°N
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
    </div>
  );
}

function DossierCard({ c }: { c: (typeof sampleCases)[number] }) {
  const statusColor =
    c.status === "OPEN"
      ? "text-brass border-brass"
      : c.status === "ARCHIVED"
      ? "text-fog border-fog"
      : "text-rust border-rust";

  return (
    <div className="dossier-card group cursor-pointer">
      <div className="dossier-tab -mb-2 ml-4 w-fit bg-charcoal-light border border-white/10 border-b-0 rounded-t px-3 py-1">
        <span className="font-mono text-[10px] text-fog tracking-wider">
          {c.number}
        </span>
      </div>
      <div className="relative bg-charcoal border border-white/10 rounded-b rounded-tr p-5">
        <div className="flex items-start justify-between mb-4">
          <span className="stamp text-rust">{c.classification}</span>
          <span className={`stamp ${statusColor}`}>{c.status}</span>
        </div>

        <div className="w-full aspect-[4/3] rounded bg-ink/60 border border-white/5 mb-4 flex items-center justify-center">
          <FileText className="w-8 h-8 text-fog/40" strokeWidth={1} aria-hidden />
        </div>

        <p className="font-display text-lg mb-3">{c.title}</p>

        <dl className="text-xs text-fog space-y-1.5 font-mono">
          <div className="flex justify-between">
            <dt>Location</dt>
            <dd className="text-parchment/80">{c.town}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Incident</dt>
            <dd className="text-parchment/80">{c.incident}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Evidence</dt>
            <dd className="text-parchment/80">{c.clues} items</dd>
          </div>
          <div className="flex justify-between">
            <dt>Difficulty</dt>
            <dd className="text-parchment/80">{c.difficulty}</dd>
          </div>
        </dl>

        <div className="mt-4 pt-4 border-t border-white/5 text-xs tracking-wide text-brass group-hover:text-brass/80">
          {copy.landing.openFile} →
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const steps = copy.landing.processSteps;

  return (
    <div className="bureau-bg min-h-screen bg-ink text-parchment">
      <header className="flex items-center justify-between px-10 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border border-brass/60 flex items-center justify-center">
            <span className="text-brass font-display text-sm">DB</span>
          </div>
          <span className="font-display text-lg tracking-wide leading-none">
            {copy.brand.name.split(" ")[0]}
            <span className="block -mt-1 text-xs tracking-[0.3em] text-fog">
              {copy.brand.name.split(" ")[1]}
            </span>
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-10 text-sm tracking-wide text-fog">
          <Link href="/cases" className="hover:text-parchment transition-colors">
            {copy.nav.officialCases.toUpperCase()}
          </Link>
          <span className="hover:text-parchment transition-colors cursor-default">
            HOW IT WORKS
          </span>
          <span className="hover:text-parchment transition-colors cursor-default">
            ABOUT
          </span>
        </nav>
      </header>

      <section className="min-h-[calc(100vh-73px)] flex items-center px-10 py-16">
        <div className="grid lg:grid-cols-2 gap-14 items-center w-full max-w-7xl mx-auto">
          <div>
            <h1 className="font-display text-6xl leading-[1.05] mb-6">
              Detective
              <br />
              <span className="text-brass">Bureau</span>
            </h1>
            <p className="text-xs tracking-[0.35em] text-fog mb-8">
              {copy.brand.tagline.toUpperCase()}
            </p>
            <p className="text-lg text-parchment/85 leading-relaxed mb-10 max-w-xl">
              {copy.landing.heroLine1}
              <br />
              {copy.landing.heroLine2}
              <br />
              {copy.landing.heroLine3}
            </p>
            <Link
              href="/cases"
              className="inline-block bg-brass text-ink font-medium tracking-wide px-8 py-3.5 rounded hover:bg-brass/90 transition-colors"
            >
              {copy.landing.ctaStartInvestigating.toUpperCase()}
            </Link>
          </div>
          <DeskScene />
        </div>
      </section>

      <section className="px-10 py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto relative border border-white/10 bg-charcoal/60 rounded p-10">
          <span className="stamp text-rust absolute -top-3 right-8 bg-ink px-2">
            CONFIDENTIAL
          </span>
          <p className="font-mono text-[11px] tracking-widest text-brass mb-4">
            {copy.landing.directiveEyebrow.toUpperCase()}
          </p>
          <h2 className="font-display text-2xl md:text-3xl mb-6 leading-snug">
            {copy.landing.directiveHeading}
          </h2>
          <p className="text-parchment/80 leading-relaxed mb-8">
            {copy.landing.directiveBody}
          </p>
          <ol className="space-y-3 font-mono text-sm text-parchment/75">
            <li className="flex gap-3">
              <span className="text-brass">I.</span>
              {copy.landing.clauseI}
            </li>
            <li className="flex gap-3">
              <span className="text-brass">II.</span>
              {copy.landing.clauseII}
            </li>
            <li className="flex gap-3">
              <span className="text-brass">III.</span>
              {copy.landing.clauseIII}
            </li>
          </ol>
        </div>
      </section>

      <section className="px-10 py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-[11px] tracking-widest text-brass mb-3">
            {copy.landing.archiveEyebrow.toUpperCase()}
          </p>
          <h2 className="font-display text-3xl mb-14">
            {copy.landing.archiveHeading}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
            {sampleCases.map((c) => (
              <DossierCard key={c.number} c={c} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-10 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="font-mono text-[11px] tracking-widest text-brass mb-3">
            {copy.landing.processEyebrow.toUpperCase()}
          </p>
          <h2 className="font-display text-3xl mb-16">
            {copy.landing.processHeading}
          </h2>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-10">
            <svg
              className="hidden md:block absolute top-10 left-0 w-full h-2 -z-0"
              preserveAspectRatio="none"
              viewBox="0 0 100 4"
            >
              <line
                x1="12"
                y1="2"
                x2="88"
                y2="2"
                stroke="#A6392F"
                strokeWidth="0.4"
                strokeDasharray="1.2 1.6"
              />
            </svg>

            {steps.map((step, i) => (
              <div
                key={step.label}
                className={`relative bg-parchment text-ink rounded-sm shadow-lg p-5 ${
                  i % 2 === 0 ? "rotate-[-2deg]" : "rotate-[2deg]"
                }`}
              >
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-rust border-2 border-ink/20" />
                <p className="font-mono text-[10px] text-ink/50 mb-2">
                  0{i + 1}
                </p>
                <p className="font-display text-base mb-2">{step.label}</p>
                <p className="text-xs text-ink/70 leading-relaxed">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-10 py-28 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl mb-4">
            {copy.landing.finalCtaHeading}
          </h2>
          <p className="text-parchment/70 mb-10">{copy.landing.finalCtaBody}</p>
          <Link
            href="/cases"
            className="inline-block bg-brass text-ink font-medium tracking-wide px-8 py-3.5 rounded hover:bg-brass/90 transition-colors"
          >
            {copy.landing.finalCta.toUpperCase()}
          </Link>
        </div>
      </section>

      <footer className="px-10 py-8 border-t border-white/5 text-center text-xs text-fog font-mono">
        DETECTIVE BUREAU — ALL FILES CLASSIFIED UNTIL OPENED
      </footer>
    </div>
  );
}