import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db/connect";
import { Investigation } from "@/models/Investigation";
import { Case } from "@/models/Case";

/**
 * GET /api/investigations
 *
 * Returns the logged-in user's own investigations (in progress and
 * concluded) across all cases, joined with basic case info (title,
 * town) for a "my cases" dashboard. Only ever returns the caller's
 * own data — userId comes from the authenticated session, never from
 * a query param, so there's no way to look up someone else's list.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view your investigations." },
        { status: 401 }
      );
    }

    await connectDB();

    const investigations = await Investigation.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    // Join in case titles/towns without a heavier aggregation — case
    // count per user will always be small, so N+1-ish is fine here.
    const caseIds = investigations.map((inv) => inv.caseId);
    const cases = await Case.find({ caseId: { $in: caseIds } })
      .select("caseId title town targetEvidenceCount")
      .lean();
    const caseById = new Map(cases.map((c) => [c.caseId, c]));

    const result = investigations.map((inv) => {
      const caseInfo = caseById.get(inv.caseId);
      return {
        caseId: inv.caseId,
        title: caseInfo?.title ?? "Unknown case",
        town: caseInfo?.town ?? "",
        status: inv.status,
        evidenceFound: inv.evidenceDiscovered.length,
        evidenceTarget: caseInfo?.targetEvidenceCount ?? null,
        accusedSuspectId: inv.accusedSuspectId,
        accusationCorrect: inv.accusationCorrect,
        lastPlayedAt: inv.updatedAt,
      };
    });

    return NextResponse.json({ investigations: result });
  } catch (err) {
    console.error("Investigations list error:", err);
    return NextResponse.json(
      { error: "Something went wrong loading your investigations." },
      { status: 500 }
    );
  }
}