"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Home,
  Star,
  Globe,
  BarChart3,
  Archive,
  StickyNote,
  Trophy,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Grid3x3,
  List,
} from "lucide-react";
import AuthNav from "@/components/AuthNav";

interface CaseSummary {
  caseId: string;
  title: string;
  town: string;
  isPremium: boolean;
  targetEvidenceCount: number;
}

interface MyInvestigation {
  caseId: string;
  status: string;
  evidenceFound: number;
  evidenceTarget: number | null;
  lastPlayedAt: string;
}

interface ProfileStats {
  rank: string;
  xp: number;
  nextRankAtXp: number | null;
  casesSolved: number;
  accuracyPercent: number | null;
  totalEvidenceFound: number;
  totalSuspectsInterrogated: number;
}

const RANK_FLOOR: Record<string, number> = {
  "Rookie Detective": 0,
  "Field Detective": 500,
  "Senior Detective": 1500,
  "Lead Investigator": 3500,
  "Chief Investigator": 7000,
};

function deriveDifficulty(targetEvidence: number): {
  label: string;
  color: string;
} {
  if (targetEvidence < 30) return { label: "Medium", color: "text-brass" };
  if (targetEvidence < 60) return { label: "Hard", color: "text-rust" };
  return { label: "Extreme", color: "text-rust" };
}

const FILTERS = [
  "All Cases",
  "Official",
  "Community",
  "Completed",
  "In Progress",
  "Unsolved",
] as const;
type FilterTab = (typeof FILTERS)[number];

const PAGE_SIZE = 8;

export default function CasesDashboardPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [myInvestigations, setMyInvestigations] = useState<MyInvestigation[]>([]);
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All Cases");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    async function load() {
      const [casesRes, invRes, profileRes] = await Promise.all([
        fetch("/api/cases"),
        fetch("/api/investigations").catch(() => null),
        fetch("/api/detective-profile").catch(() => null),
      ]);

      if (casesRes.ok) {
        const data = await casesRes.json();
        setCases(data.cases);
      }
      if (invRes && invRes.ok) {
        const data = await invRes.json();
        setMyInvestigations(data.investigations);
      }
      if (profileRes && profileRes.ok) {
        setProfile(await profileRes.json());
      }
      setLoading(false);
    }
    load();
  }, []);

  const invByCaseId = useMemo(() => {
    const map = new Map<string, MyInvestigation>();
    for (const inv of myInvestigations) map.set(inv.caseId, inv);
    return map;
  }, [myInvestigations]);

  const filtered = useMemo(() => {
    let list = cases;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) || c.town.toLowerCase().includes(q)
      );
    }

    if (activeFilter === "Completed") {
      list = list.filter(
        (c) => invByCaseId.get(c.caseId)?.status === "accused_correct"
      );
    } else if (activeFilter === "In Progress") {
      list = list.filter(
        (c) => invByCaseId.get(c.caseId)?.status === "in_progress"
      );
    } else if (activeFilter === "Unsolved") {
      list = list.filter((c) => !invByCaseId.has(c.caseId));
    }
    // "Official" = all of them for now (no community cases feature yet)
    // "Community" = empty for now (feature doesn't exist yet)
    if (activeFilter === "Community") list = [];

    return list;
  }, [cases, search, activeFilter, invByCaseId]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const xpProgress = profile
    ? profile.nextRankAtXp
      ? Math.min(
          100,
          Math.round(
            ((profile.xp - (RANK_FLOOR[profile.rank] ?? 0)) /
              (profile.nextRankAtXp - (RANK_FLOOR[profile.rank] ?? 0))) *
              100
          )
        )
      : 100
    : 0;

  return (
    <div className="min-h-screen bg-ink text-parchment flex">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-60 border-r border-white/10 shrink-0">
        <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center border border-brass bg-brass font-display text-sm leading-none text-parchment">
            DB
          </span>
          <span className="font-display text-lg uppercase leading-none tracking-wide">
            Detective
            <span className="block text-[10px] text-fog tracking-[0.2em]">
              Bureau
            </span>
          </span>
        </Link>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          <SidebarLink href="/" icon={<Home size={16} />} label="Home" />
          <SidebarLink href="/cases" icon={<Star size={16} />} label="Cases" active />
          <SidebarLink
            href="/cases"
            icon={<Star size={16} />}
            label="Official Cases"
          />
          <SidebarLink
            href="#"
            icon={<Globe size={16} />}
            label="Community Cases"
            disabled
          />
          <SidebarLink
            href="/profile"
            icon={<BarChart3 size={16} />}
            label="Detective Rank"
          />
          <SidebarLink
            href="#"
            icon={<Archive size={16} />}
            label="Evidence Locker"
            disabled
          />
          <SidebarLink href="#" icon={<StickyNote size={16} />} label="Notes" disabled />
          <SidebarLink
            href="#"
            icon={<Trophy size={16} />}
            label="Achievements"
            disabled
          />
          <div className="pt-3 mt-3 border-t border-white/5" />
          <SidebarLink href="#" icon={<Settings size={16} />} label="Settings" disabled />
          <SidebarLink
            href="#"
            icon={<HelpCircle size={16} />}
            label="Help & Support"
            disabled
          />
        </nav>

        {profile && (
          <Link
            href="/profile"
            className="m-3 p-4 bg-charcoal border border-white/10 rounded hover:border-brass/30 transition-colors"
          >
            <p className="font-mono text-[9px] tracking-widest text-fog mb-1">
              DETECTIVE PROFILE
            </p>
            <p className="font-display uppercase text-sm mb-2">{profile.rank}</p>
            <div className="h-1 bg-ink rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-brass rounded-full"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <div className="space-y-1 font-mono text-[10px]">
              <div className="flex justify-between text-fog">
                <span>Cases Solved</span>
                <span className="text-parchment">{profile.casesSolved}</span>
              </div>
              <div className="flex justify-between text-fog">
                <span>Accuracy</span>
                <span className="text-parchment">
                  {profile.accuracyPercent === null
                    ? "—"
                    : `${profile.accuracyPercent}%`}
                </span>
              </div>
              <div className="flex justify-between text-fog">
                <span>Evidence Found</span>
                <span className="text-parchment">{profile.totalEvidenceFound}</span>
              </div>
              <div className="flex justify-between text-fog">
                <span>Interrogations</span>
                <span className="text-parchment">
                  {profile.totalSuspectsInterrogated}
                </span>
              </div>
            </div>
          </Link>
        )}
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0">
        {/* TOP BAR */}
        <header className="sticky top-0 z-20 border-b border-white/10 bg-ink">
          <div className="flex items-center gap-4 px-6 py-3">
            <div className="flex-1 max-w-xl relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fog"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search cases, clues, suspects…"
                className="w-full bg-charcoal border border-white/10 rounded pl-9 pr-4 py-2 text-sm font-mono text-parchment placeholder:text-fog/60 focus:outline-none focus:border-brass/50"
              />
            </div>
            <Trophy size={18} className="text-fog hidden sm:block" />
            <Bell size={18} className="text-fog hidden sm:block" />
            <AuthNav />
          </div>
        </header>

        <main className="px-6 py-8 max-w-6xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display uppercase text-3xl mb-1">Cases</h1>
              <p className="text-fog text-sm">Solve mysteries. Uncover the truth.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded border ${
                  viewMode === "grid"
                    ? "border-brass text-brass"
                    : "border-white/10 text-fog"
                }`}
              >
                <Grid3x3 size={16} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded border ${
                  viewMode === "list"
                    ? "border-brass text-brass"
                    : "border-white/10 text-fog"
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => {
                  setActiveFilter(f);
                  setPage(1);
                }}
                className={`px-4 py-1.5 rounded text-xs font-mono tracking-wide border transition-colors ${
                  activeFilter === f
                    ? "border-brass bg-brass/10 text-brass"
                    : "border-white/10 text-fog hover:text-parchment"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="font-mono text-sm text-fog">Gathering the open cases…</p>
          ) : pageItems.length === 0 ? (
            <div className="bg-charcoal border border-white/10 rounded p-10 text-center">
              <p className="text-fog font-mono text-sm">
                No files match that search.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5"
                  : "space-y-3"
              }
            >
              {pageItems.map((c) => {
                const inv = invByCaseId.get(c.caseId);
                const difficulty = deriveDifficulty(c.targetEvidenceCount);
                const isCompleted = inv?.status === "accused_correct";
                const isCold = inv?.status === "cold";
                const isInProgress = inv?.status === "in_progress";
                const progressPct = inv
                  ? Math.min(
                      100,
                      Math.round((inv.evidenceFound / c.targetEvidenceCount) * 100)
                    )
                  : 0;

                return (
                  <Link
                    key={c.caseId}
                    href={`/cases/${c.caseId}`}
                    className="group bg-charcoal border border-white/10 rounded-lg overflow-hidden hover:border-brass/30 transition-colors"
                  >
                    <div className="relative aspect-[16/10] bg-ink/60 flex items-center justify-center">
                      {(isCompleted || isCold || isInProgress) && (
                        <span
                          className={`absolute top-2 left-2 text-[9px] font-mono tracking-widest px-2 py-1 rounded ${
                            isCompleted
                              ? "bg-brass/20 text-brass"
                              : isCold
                              ? "bg-rust/20 text-rust"
                              : "bg-white/10 text-parchment"
                          }`}
                        >
                          {isCompleted ? "COMPLETED" : isCold ? "COLD" : "IN PROGRESS"}
                        </span>
                      )}
                      {!inv && (
                        <span className="absolute top-2 left-2 text-[9px] font-mono tracking-widest px-2 py-1 rounded bg-brass text-ink">
                          NEW
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-fog/40">
                        {c.caseId}
                      </span>
                    </div>

                    <div className="p-4">
                      <p className="font-display uppercase text-base mb-2">
                        {c.title}
                      </p>
                      <p className="text-xs text-fog mb-3">{c.town}</p>

                      <div className="flex items-center justify-between font-mono text-[11px] mb-2">
                        <span className={difficulty.color}>{difficulty.label}</span>
                        <span className="text-fog">
                          {inv ? `${inv.evidenceFound} / ` : ""}
                          {c.targetEvidenceCount}
                        </span>
                      </div>

                      {isInProgress && (
                        <div className="h-1 bg-ink rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brass rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded border border-white/10 text-fog disabled:opacity-30 text-sm"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`px-3 py-1.5 rounded border text-sm font-mono ${
                    page === n
                      ? "border-brass text-brass"
                      : "border-white/10 text-fog"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded border border-white/10 text-fog disabled:opacity-30 text-sm"
              >
                →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
  active,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 rounded text-sm text-fog/40 cursor-default">
        {icon}
        <span>{label}</span>
        <span className="ml-auto text-[9px] font-mono">SOON</span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
        active
          ? "bg-brass/10 text-brass border border-brass/30"
          : "text-fog hover:text-parchment hover:bg-white/5"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}