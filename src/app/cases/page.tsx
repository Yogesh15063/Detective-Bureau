import Link from "next/link";
import SceneBackground from "@/components/SceneBackground";

interface CaseSummary {
  caseId: string;
  title: string;
  town: string;
  isPremium: boolean;
  targetEvidenceCount: number;
}

async function getCases(): Promise<CaseSummary[]> {
  // Server component — call the DB-backed logic directly rather than
  // hopping through our own HTTP API (avoids an unnecessary network
  // round trip during server rendering).
  const { connectDB } = await import("@/lib/db/connect");
  const { Case } = await import("@/models/Case");

  await connectDB();
  const cases = await Case.find({ isPublished: true })
    .select("caseId title town isPremium targetEvidenceCount")
    .lean();

  return cases.map((c) => ({
    caseId: c.caseId,
    title: c.title,
    town: c.town,
    isPremium: c.isPremium,
    targetEvidenceCount: c.targetEvidenceCount,
  }));
}

export default async function CasesPage() {
  const cases = await getCases();

  return (
    <div className="min-h-screen text-parchment">
      <SceneBackground />

      <div className="relative z-10">
        <header className="sticky top-0 z-20 flex items-center justify-between px-10 py-6 border-b border-white/5 bg-ink">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-brass/60 flex items-center justify-center">
              <span className="text-brass font-display text-sm">DB</span>
            </div>
            <span className="font-display uppercase text-lg tracking-wide leading-none">
              Detective
              <span className="block -mt-1 text-xs tracking-[0.3em] text-fog">
                Bureau
              </span>
            </span>
          </Link>
        </header>

        <main className="px-10 py-16 max-w-6xl mx-auto">
          <p className="font-mono text-[11px] tracking-widest text-brass mb-3">
            CASE ARCHIVE
          </p>
          <h1 className="font-display uppercase text-4xl mb-3">
            Official Cases
          </h1>
          <p className="text-fog mb-12">
            Handpicked cases. Real mysteries. Real truth.
          </p>

          {cases.length === 0 ? (
            <div className="bg-charcoal border border-white/10 rounded p-10 text-center">
              <p className="text-fog font-mono text-sm">
                No files in the archive yet. Check back once the Bureau
                opens its first case.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((c) => (
                <Link
                  key={c.caseId}
                  href={`/cases/${c.caseId}`}
                  className="dossier-card group block"
                >
                  <div className="dossier-tab -mb-2 ml-4 w-fit bg-charcoal-light border border-white/10 border-b-0 rounded-t px-3 py-1">
                    <span className="font-mono text-[10px] text-fog tracking-wider">
                      {c.caseId}
                    </span>
                  </div>
                  <div className="relative bg-charcoal border border-white/10 rounded-b rounded-tr p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="stamp text-rust text-[9px]">
                        {c.isPremium ? "PREMIUM" : "OPEN ACCESS"}
                      </span>
                    </div>

                    <p className="font-display text-base mb-1 uppercase tracking-wide">
                      {c.title}
                    </p>
                    <p className="font-mono text-[10px] text-fog mb-3">
                      {c.town}
                    </p>

                    <dl className="text-[11px] text-fog space-y-1 font-mono">
                      <div className="flex justify-between">
                        <dt>Evidence</dt>
                        <dd className="text-parchment/80">
                          {c.targetEvidenceCount} items
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 pt-3 border-t border-white/5 text-[11px] tracking-wide text-brass group-hover:text-brass/80">
                      Open File →
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}