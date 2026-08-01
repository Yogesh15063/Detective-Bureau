import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";

/**
 * GET /api/detective-profile
 *
 * Real aggregated stats for the logged-in detective, computed from
 * their actual Investigation documents — nothing here is placeholder
 * or fabricated. Intended to back a future "Detective Profile" UI
 * (rank/XP panel, stats sidebar, etc.) with genuine numbers.
 *
 * XP and rank are a first-pass formula (documented below) — easy to
 * retune later without changing the shape of this response.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view your detective profile." },
        { status: 401 }
      );
    }

    await connectDB();
    const investigations = await Investigation.find({ userId }).lean();

    let casesSolved = 0;
    let casesCold = 0;
    let casesInProgress = 0;
    let totalAccusationsCorrect = 0;
    let totalAccusationsWrong = 0;
    let totalEvidenceFound = 0;
    let totalSuspectsInterrogated = 0;
    let totalWitnessesInterviewed = 0;
    let totalLocationsVisited = 0;

    for (const inv of investigations) {
      if (inv.status === "accused_correct") {
        casesSolved += 1;
        totalAccusationsCorrect += 1;
      } else if (inv.status === "cold") {
        casesCold += 1;
      } else {
        casesInProgress += 1;
      }

      totalAccusationsWrong += inv.wrongAccusationCount ?? 0;
      totalEvidenceFound += inv.evidenceDiscovered?.length ?? 0;
      totalSuspectsInterrogated += inv.suspectsInterrogated?.length ?? 0;
      totalWitnessesInterviewed += inv.witnessesInterviewed?.length ?? 0;
      totalLocationsVisited += inv.locationsVisited?.length ?? 0;
    }

    const totalAccusationsMade = totalAccusationsCorrect + totalAccusationsWrong;
    const accuracyPercent =
      totalAccusationsMade > 0
        ? Math.round((totalAccusationsCorrect / totalAccusationsMade) * 100)
        : null; // null, not 0 — "no accusations yet" is different from "0% accuracy"

    // --- XP / rank formula (v1 — tune freely, shape of response won't change) ---
    // Evidence and interrogations count toward XP even on cases not yet
    // solved, since investigative work has value regardless of outcome.
    // Solving a case is worth far more than any single action within it.
    const xp =
      totalEvidenceFound * 10 +
      totalSuspectsInterrogated * 15 +
      totalWitnessesInterviewed * 10 +
      casesSolved * 250 -
      casesCold * 50; // going cold costs XP, but never below 0 overall

    const xpClamped = Math.max(0, xp);

    const RANK_THRESHOLDS = [
      { rank: "Rookie Detective", minXp: 0 },
      { rank: "Field Detective", minXp: 500 },
      { rank: "Senior Detective", minXp: 1500 },
      { rank: "Lead Investigator", minXp: 3500 },
      { rank: "Chief Investigator", minXp: 7000 },
    ] as const;

    let rank: string = RANK_THRESHOLDS[0].rank;
    let nextThreshold: number | null = RANK_THRESHOLDS[1]?.minXp ?? null;
    for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xpClamped >= RANK_THRESHOLDS[i].minXp) {
        rank = RANK_THRESHOLDS[i].rank;
        nextThreshold = RANK_THRESHOLDS[i + 1]?.minXp ?? null;
        break;
      }
    }

    return NextResponse.json({
      casesSolved,
      casesCold,
      casesInProgress,
      totalCasesStarted: investigations.length,
      accuracyPercent, // null if no accusations made yet
      totalAccusationsMade,
      totalEvidenceFound,
      totalSuspectsInterrogated,
      totalWitnessesInterviewed,
      totalLocationsVisited,
      xp: xpClamped,
      rank,
      nextRankAtXp: nextThreshold,
    });
  } catch (err) {
    console.error("Detective profile stats error:", err);
    return NextResponse.json(
      { error: "Something went wrong pulling your record." },
      { status: 500 }
    );
  }
}