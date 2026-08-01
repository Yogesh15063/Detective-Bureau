import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";
import { loadPlayerCase } from "@/lib/cases/loadCase";

/**
 * GET /api/cases/[caseId]
 *
 * Returns the player-safe case intro (via loadPlayerCase, so it's
 * already redacted — no solution, no hidden_truth). If the visitor is
 * logged in and already has an investigation in progress for this
 * case, we also return their existing status/progress so the
 * frontend can offer "continue" instead of "start."
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const playerCase = await loadPlayerCase(caseId);

    const { userId } = await auth();

    let existingProgress = null;
    if (userId) {
      await connectDB();
      const investigation = await Investigation.findOne({ userId, caseId });
      if (investigation) {
        existingProgress = {
          status: investigation.status,
          evidenceDiscovered: investigation.evidenceDiscovered,
          locationsVisited: investigation.locationsVisited,
          witnessesInterviewed: investigation.witnessesInterviewed,
          suspectsInterrogated: investigation.suspectsInterrogated,
          wrongAccusationCount: investigation.wrongAccusationCount,
          conversationHistory: investigation.conversationHistory,
        };
      }
    }

    return NextResponse.json({
      case: playerCase.case,
      suspects: playerCase.suspects.map((s) => ({
        id: s.id,
        name: s.name,
        role: s.role,
      })),
      witnesses: playerCase.witnesses.map((w) => ({
        id: w.id,
        name: w.name,
        role: w.role,
      })),
      locations: playerCase.locations.map((l) => ({
        id: l.id,
        name: l.name,
        description: l.description,
      })),
      existingProgress,
    });
  } catch (err) {
    console.error("Case detail error:", err);
    return NextResponse.json(
      { error: "Case not found or something went wrong." },
      { status: 404 }
    );
  }
}