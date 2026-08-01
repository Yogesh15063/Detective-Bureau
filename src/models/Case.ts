import { Schema, model, models, type Document } from "mongoose";
import type { MasterCase } from "@/types/case";

/**
 * We store the entire master.json as one flexible document (via
 * `Schema.Types.Mixed` for the body) rather than modeling every
 * nested field individually. This matches the project rule that
 * "adding new cases must never require code changes" — the locked
 * TypeScript schema (src/types/case.ts) is what enforces structure,
 * not the Mongo schema.
 *
 * A few top-level fields are pulled out and indexed for querying
 * (case list pages, admin dashboards, free/premium filtering) without
 * needing to reach into the nested JSON.
 */
export interface CaseDocument extends Document {
  caseId: string; // matches master.case.id, e.g. "CASE-GH-1979R-2025"
  title: string;
  town: string;
  isPremium: boolean;
  isPublished: boolean;
  targetEvidenceCount: number;
  coverImage: string | null;
  masterData: MasterCase; // full source of truth, NEVER sent to client as-is
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<CaseDocument>(
  {
    caseId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    town: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    targetEvidenceCount: { type: Number, required: true },
    coverImage: { type: String, default: null },
    masterData: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

// Prevent model overwrite errors during Next.js hot-reload
export const Case = models.Case || model<CaseDocument>("Case", CaseSchema);