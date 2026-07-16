import type { MasterCase, PlayerCase } from "@/types/case";
import { redactToPlayerCase, assertNoLeakage } from "./redact";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/models/Case";

/**
 * Loads a case's master record from MongoDB and returns ONLY the
 * redacted, player-safe version. This is the single function the
 * rest of the app (API routes, AI narrator) should ever call to get
 * case data during actual gameplay.
 */
export async function loadPlayerCase(caseId: string): Promise<PlayerCase> {
  const master = await loadMasterCase(caseId);
  const playerCase = redactToPlayerCase(master);
  assertNoLeakage(playerCase);
  return playerCase;
}

/**
 * Loads the full master case. Intended ONLY for:
 * - admin tooling
 * - server-side accusation verification (checking a guess against solution)
 * Never pass this object to an AI prompt or API response.
 */
export async function loadMasterCase(caseId: string): Promise<MasterCase> {
  await connectDB();

  const doc = await Case.findOne({ caseId }).lean();

  if (!doc) {
    throw new Error(`Case not found: ${caseId}`);
  }

  return doc.masterData as MasterCase;
}