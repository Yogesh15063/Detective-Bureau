import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";
import {
  loadPlayerCase,
  getUnlockedIds,
  getSuspectBoard,
} from "@/lib/cases/loadCase";
import { runNarratorTurn } from "@/lib/ai/narrator";
import { validateStateUpdate } from "@/lib/evidence/validate";

/**
 * POST /api/investigation/[caseId]/message
 *
 * Body: { message: string }
 *
 * Flow:
 * 1. Load or create this player's Investigation doc for this case.
 * 2. Work out which suspects are on the board BEFORE this turn.
 * 3. Load the player-safe case file (hidden suspects masked).
 * 4. Run one narrator turn (Gemini call).
 * 5. Apply the returned state update and save.
 * 6. Work out who is on the board AFTER, so new suspects can be announced.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await req.json();
    const { message } = body;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to investigate a case." },
        { status: 401 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Missing 'message' in request body." },
        { status: 400 }
      );
    }

    await connectDB();

    let investigation = await Investigation.findOne({ userId, caseId });
    if (!investigation) {
      investigation = await Investigation.create({ userId, caseId });
    }

    if (investigation.status !== "in_progress") {
      return NextResponse.json(
        { error: "This investigation has already concluded." },
        { status: 400 }
      );
    }

    // Board BEFORE this turn
    const unlockedBefore = getUnlockedIds(investigation);
    const boardBefore = await getSuspectBoard(caseId, unlockedBefore);

    // Player-safe case: hidden suspects are removed / masked
    const playerCase = await loadPlayerCase(caseId, unlockedBefore);

    const { narrative, stateUpdate: rawStateUpdate } = await runNarratorTurn(
      playerCase,
      investigation,
      message
    );

    const { stateUpdate, warnings } = validateStateUpdate(
      playerCase,
      investigation,
      rawStateUpdate
    );

    if (warnings.length > 0) {
      console.warn(
        `Narrator state validation warnings for case ${caseId}:`,
        warnings
      );
    }

    const mergeUnique = (existing: string[], incoming?: string[]) =>
      Array.from(new Set([...existing, ...(incoming ?? [])]));

    investigation.evidenceDiscovered = mergeUnique(
      investigation.evidenceDiscovered,
      stateUpdate.evidence_discovered
    );
    investigation.locationsVisited = mergeUnique(
      investigation.locationsVisited,
      stateUpdate.locations_visited
    );
    investigation.witnessesInterviewed = mergeUnique(
      investigation.witnessesInterviewed,
      stateUpdate.witnesses_interviewed
    );
    investigation.suspectsInterrogated = mergeUnique(
      investigation.suspectsInterrogated,
      stateUpdate.suspects_interrogated
    );

    if (stateUpdate.contradictions_presented) {
      for (const c of stateUpdate.contradictions_presented) {
        const existing =
          investigation.contradictionsPresentedToSuspects[c.suspect_id] ?? [];
        investigation.contradictionsPresentedToSuspects[c.suspect_id] =
          Array.from(new Set([...existing, c.contradiction]));
      }
      investigation.markModified("contradictionsPresentedToSuspects");
    }

    if (stateUpdate.milestone_flags) {
      investigation.milestoneFlags = {
        ...investigation.milestoneFlags,
        ...stateUpdate.milestone_flags,
      };
      investigation.markModified("milestoneFlags");
    }

    investigation.conversationHistory.push(
      { role: "player", content: message, timestamp: new Date() },
      { role: "narrator", content: narrative, timestamp: new Date() }
    );

    await investigation.save();

    // Board AFTER this turn: anyone not on the old board is newly unlocked
    const boardAfter = await getSuspectBoard(
      caseId,
      getUnlockedIds(investigation)
    );
    const beforeIds = new Set(boardBefore.map((s) => s.id));
    const newlyUnlockedSuspects = boardAfter.filter(
      (s) => !beforeIds.has(s.id)
    );

    return NextResponse.json({
      narrative,
      progress: {
        evidenceDiscovered: investigation.evidenceDiscovered,
        locationsVisited: investigation.locationsVisited,
        witnessesInterviewed: investigation.witnessesInterviewed,
        suspectsInterrogated: investigation.suspectsInterrogated,
        targetEvidenceCount: playerCase.case.target_evidence_count,
      },
      suspects: boardAfter,
      newlyUnlockedSuspects,
    });
  } catch (err) {
    console.error("Investigation message error:", err);
    return NextResponse.json(
      { error: "Something went wrong processing your message." },
      { status: 500 }
    );
  }
}