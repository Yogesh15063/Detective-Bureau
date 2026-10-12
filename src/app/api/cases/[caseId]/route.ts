import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";
import { loadPlayerCase, getUnlockedIds } from "@/lib/cases/loadCase";

/**
 * GET /api/cases/[caseId]
 *
 * Returns the player-safe case intro. Suspects are filtered by what this
 * player has unlocked so far (progressive reveal). Visitors who are not
 * signed in, or have not started, only see the starting suspects.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;

    const { userId } = await auth();

    let existingProgress = null;
    let unlockedIds: string[] = [];

    if (userId) {
      await connectDB();
      const investigation = await Investigation.findOne({ userId, caseId });
      if (investigation) {
        unlockedIds = getUnlockedIds(investigation);
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

    const playerCase = await loadPlayerCase(caseId, unlockedIds);

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