import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/models/Case";
import { saveCoverImage } from "@/lib/storage/saveCoverImage";
import type { MasterCase } from "@/types/case";

/**
 * POST /api/admin/cases
 *
 * multipart/form-data with fields:
 *   - adminKey: string (must match ADMIN_UPLOAD_SECRET env var)
 *   - caseJson: File (the master.json for the case)
 *   - coverImage: File (optional — image file)
 *   - isPublished: "true" | "false"
 *   - isPremium: "true" | "false"
 *
 * No real admin role system yet — protected by a shared secret for
 * now. Upgrade to a proper Clerk admin role check later without
 * changing anything else about this route's logic.
 */

const REQUIRED_MASTER_KEYS = [
  "case",
  "solution",
  "hidden_truth",
  "suspects",
  "witnesses",
  "locations",
  "evidence",
  "game_state_template",
];

export async function POST(req: NextRequest) {
  try {
    const adminSecret = process.env.ADMIN_UPLOAD_SECRET;
    if (!adminSecret) {
      return NextResponse.json(
        { error: "ADMIN_UPLOAD_SECRET is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const adminKey = formData.get("adminKey");
    if (adminKey !== adminSecret) {
      return NextResponse.json(
        { error: "Invalid admin key." },
        { status: 401 }
      );
    }

    const caseJsonFile = formData.get("caseJson");
    if (!(caseJsonFile instanceof File)) {
      return NextResponse.json(
        { error: "Missing caseJson file." },
        { status: 400 }
      );
    }

    let master: MasterCase;
    try {
      const text = await caseJsonFile.text();
      master = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "caseJson is not valid JSON." },
        { status: 400 }
      );
    }

    const missingKeys = REQUIRED_MASTER_KEYS.filter(
      (key) => !(key in (master as object))
    );
    if (missingKeys.length > 0) {
      return NextResponse.json(
        {
          error: `Case file is missing required top-level keys: ${missingKeys.join(", ")}`,
        },
        { status: 400 }
      );
    }
    if (!master.case?.id || !master.case?.title) {
      return NextResponse.json(
        { error: "case.id and case.title are required." },
        { status: 400 }
      );
    }
    if (!master.solution?.killer) {
      return NextResponse.json(
        { error: "solution.killer is required — this case has no answer." },
        { status: 400 }
      );
    }

    let coverImageUrl: string | null = null;
    const coverImageFile = formData.get("coverImage");
    if (coverImageFile instanceof File && coverImageFile.size > 0) {
      coverImageUrl = await saveCoverImage(master.case.id, coverImageFile);
    }

    const isPublished = formData.get("isPublished") === "true";
    const isPremium = formData.get("isPremium") === "true";

    await connectDB();

    const doc = await Case.findOneAndUpdate(
      { caseId: master.case.id },
      {
        caseId: master.case.id,
        title: master.case.title,
        town: master.case.town,
        targetEvidenceCount: master.case.target_evidence_count,
        coverImage: coverImageUrl ?? master.case.cover_image ?? null,
        masterData: master,
        isPublished,
        isPremium,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      caseId: doc.caseId,
      title: doc.title,
      coverImage: doc.coverImage,
      isPublished: doc.isPublished,
    });
  } catch (err) {
    console.error("Admin case upload error:", err);
    return NextResponse.json(
      { error: "Something went wrong uploading the case." },
      { status: 500 }
    );
  }
}