"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";

interface ProfileStats {
  casesSolved: number;
  casesCold: number;
  casesInProgress: number;
  totalCasesStarted: number;
  accuracyPercent: number | null;
  totalAccusationsMade: number;
  totalEvidenceFound: number;
  totalSuspectsInterrogated: number;
  totalWitnessesInterviewed: number;
  totalLocationsVisited: number;
  xp: number;
  rank: string;
  nextRankAtXp: number | null;
}

const RANK_FLOOR: Record<string, number> = {
  "Rookie Detective": 0,
  "Field Detective": 500,
  "Senior Detective": 1500,
  "Lead Investigator": 3500,
  "Chief Investigator": 7000,
};

function buildFieldSummary(s: ProfileStats): string {
  if (s.totalCasesStarted === 0) {
    return "No file has been opened yet. The Bureau has no record of you — until you pick up your first case.";
  }
  const parts: string[] = [];
  parts.push(
    s.casesSolved > 0
      ? `${s.casesSolved} case${s.casesSolved === 1 ? "" : "s"} closed with a name attached to it`
      : "no case closed yet"
  );
  if (s.casesCold > 0) {
    parts.push(`${s.casesCold} gone cold`);
  }
  if (s.casesInProgress > 0) {
    parts.push(`${s.casesInProgress} still open on the desk`);
  }
  const accuracyLine =
    s.accuracyPercent !== null
      ? ` Of the accusations filed, ${s.accuracyPercent}% held up.`
      : "";
  return `${parts.join(", ")}. ${s.totalEvidenceFound} pieces of evidence recovered, ${s.totalSuspectsInterrogated} suspects put across the table.${accuracyLine}`;
}

export default function DetectiveProfilePage() {
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/detective-profile");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Couldn't pull your record.");
        setLoading(false);
        return;
      }
      setStats(await res.json());
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-ink text-parchment">
      <header className="sticky top-0 z-20 border-b border-parchment/10 bg-ink">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center border border-brass bg-brass font-display text-lg leading-none text-parchment">
              DB
            </span>
            <span className="font-display text-2xl uppercase leading-none tracking-wide text-parchment">
              Detective Bureau
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/cases"
              className="font-mono text-xs uppercase tracking-[0.18em] text-fog hover:text-parchment"
            >
              Official Cases
            </Link>
            <AuthNav />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {loading && (
          <p className="font-mono text-sm text-fog">Pulling your record…</p>
        )}
        {errorMsg && <p className="font-mono text-sm text-rust">{errorMsg}</p>}

        {stats && (
          <>
            {/* PERSONNEL FILE HEADER */}
            <div className="relative bg-charcoal border border-white/10 rounded p-8 mb-8">
              <span className="stamp text-brass absolute -top-3 right-8 bg-ink px-2">
                ACTIVE DUTY
              </span>

              <p className="font-mono text-[11px] tracking-widest text-brass mb-1">
                BUREAU PERSONNEL FILE
              </p>
              <h1 className="font-display uppercase text-4xl mb-1">
                {stats.rank}
              </h1>
              <p className="font-mono text-xs text-fog mb-6">
                FIELD EXPERIENCE: {stats.xp} XP
                {stats.nextRankAtXp !== null &&
                  ` — ${stats.nextRankAtXp - stats.xp} XP TO NEXT RANK`}
              </p>

              {stats.nextRankAtXp !== null ? (
                <div className="h-1.5 bg-ink rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-brass rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((stats.xp - (RANK_FLOOR[stats.rank] ?? 0)) /
                            (stats.nextRankAtXp - (RANK_FLOOR[stats.rank] ?? 0))) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              ) : (
                <p className="font-mono text-[11px] text-brass mb-6">
                  Highest rank in the Bureau. There is nowhere higher to climb.
                </p>
              )}

              <p className="text-sm text-parchment/80 leading-relaxed border-t border-white/5 pt-5">
                {buildFieldSummary(stats)}
              </p>
            </div>

            {/* LEDGER */}
            <div className="bg-charcoal border border-white/10 rounded p-6 mb-8">
              <p className="font-mono text-[10px] tracking-widest text-brass mb-4">
                CASE LEDGER
              </p>
              <LedgerRow label="Cases closed, name attached" value={stats.casesSolved} />
              <LedgerRow label="Cases gone cold" value={stats.casesCold} />
              <LedgerRow label="Cases still open" value={stats.casesInProgress} />
              <LedgerRow label="Total files opened" value={stats.totalCasesStarted} />
              <LedgerRow
                label="Accusations that held up"
                value={
                  stats.accuracyPercent === null
                    ? "No accusations filed"
                    : `${stats.accuracyPercent}%`
                }
              />
              <div className="my-3 border-t border-white/5" />
              <LedgerRow label="Evidence recovered" value={stats.totalEvidenceFound} />
              <LedgerRow
                label="Suspects interrogated"
                value={stats.totalSuspectsInterrogated}
              />
              <LedgerRow
                label="Witnesses interviewed"
                value={stats.totalWitnessesInterviewed}
              />
              <LedgerRow
                label="Locations searched"
                value={stats.totalLocationsVisited}
              />
            </div>

            <Link
              href="/cases"
              className="inline-block bg-brass text-parchment font-medium tracking-wide px-8 py-3.5 rounded hover:bg-brass-dim transition-colors"
            >
              {stats.totalCasesStarted === 0
                ? "Open Your First File"
                : "Back to the Archive"}
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

function LedgerRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 font-mono text-sm">
      <span className="text-fog">{label}</span>
      <span className="text-parchment">{value}</span>
    </div>
  );
}