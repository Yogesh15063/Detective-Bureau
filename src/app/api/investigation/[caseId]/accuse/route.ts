import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";
import { loadPlayerCase, loadMasterCase } from "@/lib/cases/loadCase";

/**
 * POST /api/investigation/[caseId]/accuse
 *
 * Body: { userId: string, suspectId: string }
 *
 * This is the ONLY place in the entire app allowed to load the master
 * case and compare against `solution.killer`. The result (correct or
 * not) is computed server-side and only the verdict is returned —
 * never the raw master object before this point.
 *
 * Once an investigation concludes (correct or incorrect), it's fair
 * game to reveal the full solution — that's the verdict screen's job.
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

    const playerCase = await loadPlayerCase(caseId);
    const accusedSuspect = playerCase.suspects.find((s) => s.id === suspectId);
    if (!accusedSuspect) {
      return NextResponse.json(
        { error: `Unknown suspect id: ${suspectId}` },
        { status: 400 }
      );
    }

    // The one and only place the master file gets loaded during actual
    // gameplay — for solution comparison only, never sent to the client
    // until the case is already concluded below.
    const masterCase = await loadMasterCase(caseId);

    // solution.killer is stored as the killer's NAME (e.g. "Warren Pell"),
    // not a suspect id — so we compare the accused suspect's name, not
    // the raw id, and do it case/whitespace-insensitively to avoid
    // silent false negatives from minor formatting differences.
    const normalize = (s: string) => s.trim().toLowerCase();
    const correct =
      normalize(accusedSuspect.name) === normalize(masterCase.solution.killer);

    investigation.accusedSuspectId = suspectId;
    investigation.accusationCorrect = correct;

    if (correct) {
      investigation.status = "accused_correct";
    } else {
      investigation.wrongAccusationCount += 1;
      // Two failed accusations and the file goes cold. Otherwise the
      // investigation stays open — the player can keep gathering
      // evidence and try again.
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
    const evidenceTarget = playerCase.case.target_evidence_count;
    const investigationScorePercent = Math.min(
      100,
      Math.round((evidenceFound / evidenceTarget) * 100)
    );

    return NextResponse.json({
      correct,
      concluded,
      attemptsRemaining: concluded ? 0 : attemptsRemaining,
      accusedSuspectId: suspectId,
      // Solution only revealed once the file is actually closed
      // (correct, or out of attempts) — a wrong guess with retries
      // left should not spoil the case.
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