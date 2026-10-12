import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";
import { loadMasterCase, getUnlockedIds } from "@/lib/cases/loadCase";
import { getVisibleSuspectIds } from "@/lib/cases/redact";

/**
 * POST /api/investigation/[caseId]/accuse
 *
 * Body: { suspectId: string }
 *
 * This is the ONLY place in the entire app allowed to compare against
 * `solution.killer`. Only the verdict is returned, never the raw master
 * object before the case is concluded.
 *
 * Two-strike rule: a wrong accusation with attempts remaining keeps
 * the investigation open. A second wrong accusation marks the case
 * "cold" and reveals the truth.
 *
 * Evidence gate: the player must have discovered the case's
 * key_proof_chain before an accusation can be filed.
 *
 * Progressive reveal: only suspects the player has unlocked can be accused.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    const body = await req.json();
    const { suspectId } = body;

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to make an accusation." },
        { status: 401 }
      );
    }

    if (!suspectId || typeof suspectId !== "string") {
      return NextResponse.json(
        { error: "Missing 'suspectId' in request body." },
        { status: 400 }
      );
    }

    await connectDB();

    const investigation = await Investigation.findOne({ userId, caseId });
    if (!investigation) {
      return NextResponse.json(
        { error: "No investigation found for this case. Start investigating first." },
        { status: 404 }
      );
    }

    if (investigation.status !== "in_progress") {
      return NextResponse.json(
        { error: "This investigation has already concluded." },
        { status: 400 }
      );
    }

    // Master case: used for solution comparison only, never sent to the
    // client until the case is concluded below.
    const masterCase = await loadMasterCase(caseId);

    // Progressive reveal: only unlocked suspects can be accused.
    // Same error for "hidden" and "doesn't exist" so the API never
    // confirms that a hidden suspect is real.
    const visibleIds = getVisibleSuspectIds(
      masterCase,
      getUnlockedIds(investigation)
    );
    const accusedSuspect = masterCase.suspects.find(
      (s) => s.id === suspectId && visibleIds.has(s.id)
    );
    if (!accusedSuspect) {
      return NextResponse.json(
        { error: `Unknown suspect id: ${suspectId}` },
        { status: 400 }
      );
    }

    const evidenceTarget = masterCase.case.target_evidence_count;

    // Evidence gate
    const keyProof = masterCase.solution.key_proof_chain ?? [];
    const discovered = new Set(investigation.evidenceDiscovered);
    const missingKeyEvidence = keyProof.filter((id) => !discovered.has(id));

    if (keyProof.length > 0 && missingKeyEvidence.length > 0) {
      return NextResponse.json(
        {
          blocked: true,
          error:
            "You don't have enough to make this stick yet, Detective. Keep digging.",
          evidenceFound: investigation.evidenceDiscovered.length,
          evidenceTarget,
        },
        { status: 400 }
      );
    }

    // solution.killer is the killer's NAME, so compare names
    // (case/whitespace-insensitive).
    const normalize = (s: string) => s.trim().toLowerCase();
    const correct =
      normalize(accusedSuspect.name) === normalize(masterCase.solution.killer);

    investigation.accusedSuspectId = suspectId;
    investigation.accusationCorrect = correct;

    if (correct) {
      investigation.status = "accused_correct";
    } else {
      investigation.wrongAccusationCount += 1;
      investigation.status =
        investigation.wrongAccusationCount >= 2 ? "cold" : "in_progress";
    }
    await investigation.save();

    const concluded = investigation.status !== "in_progress";
    const attemptsRemaining = Math.max(
      0,
      2 - investigation.wrongAccusationCount
    );

    const evidenceFound = investigation.evidenceDiscovered.length;
    const investigationScorePercent = Math.min(
      100,
      Math.round((evidenceFound / evidenceTarget) * 100)
    );

    return NextResponse.json({
      correct,
      concluded,
      attemptsRemaining: concluded ? 0 : attemptsRemaining,
      accusedSuspectId: suspectId,
      actualKiller: concluded ? masterCase.solution.killer : null,
      verdict: concluded
        ? {
            howItHappened: masterCase.solution.how_it_happened,
            trueMotive: masterCase.solution.true_motive,
            keyProofChain: masterCase.solution.key_proof_chain,
            fullNarrative: masterCase.hidden_truth.full_narrative,
          }
        : null,
      score: {
        evidenceFound,
        evidenceTarget,
        investigationScorePercent,
      },
    });
  } catch (err) {
    console.error("Accusation error:", err);
    return NextResponse.json(
      { error: "Something went wrong processing the accusation." },
      { status: 500 }
    );
  }
}