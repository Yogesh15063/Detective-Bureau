import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/models/Case";

/**
 * GET /api/cases
 *
 * Returns a lightweight, spoiler-free list of published cases for the
 * case-selection screen. Only the fields we indexed on the Case model
 * itself — never touches masterData.
 */
export async function GET() {
  try {
    await connectDB();

    const cases = await Case.find({ isPublished: true })
      .select("caseId title town isPremium targetEvidenceCount coverImage")
      .lean();

    return NextResponse.json({
      cases: cases.map((c) => ({
        caseId: c.caseId,
        title: c.title,
        town: c.town,
        isPremium: c.isPremium,
        targetEvidenceCount: c.targetEvidenceCount,
        coverImage: c.coverImage ?? null,
      })),
    });
  } catch (err) {
    console.error("Case list error:", err);
    return NextResponse.json(
      { error: "Something went wrong loading the case list." },
      { status: 500 }
    );
  }
}