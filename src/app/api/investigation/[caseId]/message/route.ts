import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";
import { loadPlayerCase } from "@/lib/cases/loadCase";
import { runNarratorTurn } from "@/lib/ai/narrator";
import { validateStateUpdate } from "@/lib/evidence/validate";

/**
 * POST /api/investigation/[caseId]/message
 *
 * Body: { message: string, userId: string }
 * (userId is a temporary placeholder param until Clerk auth is wired in —
 * at that point this will come from the authenticated session instead.)
 *
 * Flow:
 * 1. Load or create this player's Investigation doc for this case.
 * 2. Load the player-safe case file.
 * 3. Run one narrator turn (Gemini call).
 * 4. Apply the returned state update to the Investigation doc.
 * 5. Save conversation history.
 * 6. Return the narrative text to the client.
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

    // Load or create the investigation doc for this (user, case) pair
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

    const playerCase = await loadPlayerCase(caseId);

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
      // These indicate the AI hallucinated an id or skipped a
      // prerequisite. Not fatal to the player's turn, but worth
      // watching during testing — if these show up a lot, the system
      // prompt likely needs tightening.
      console.warn(
        `Narrator state validation warnings for case ${caseId}:`,
        warnings
      );
    }

    // Merge state update into the investigation doc (dedupe with Sets)
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

    // Append this turn to conversation history
    investigation.conversationHistory.push(
      { role: "player", content: message, timestamp: new Date() },
      { role: "narrator", content: narrative, timestamp: new Date() }
    );

    await investigation.save();

    return NextResponse.json({
      narrative,
      progress: {
        evidenceDiscovered: investigation.evidenceDiscovered,
        locationsVisited: investigation.locationsVisited,
        witnessesInterviewed: investigation.witnessesInterviewed,
        suspectsInterrogated: investigation.suspectsInterrogated,
        targetEvidenceCount: playerCase.case.target_evidence_count,
      },
    });
  } catch (err) {
    console.error("Investigation message error:", err);
    return NextResponse.json(
      { error: "Something went wrong processing your message." },
      { status: 500 }
    );
  }
}