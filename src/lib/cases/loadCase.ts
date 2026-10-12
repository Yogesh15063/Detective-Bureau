import type { MasterCase, PlayerCase } from "@/types/case";
import { redactToPlayerCase, assertNoLeakage } from "./redact";
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/models/Case";
import { getVisibleSuspectIds } from "./redact";
/**
 * Loads a case and returns ONLY the redacted, player-safe version.
 * unlockedIds = evidence found + witnesses interviewed (see getUnlockedIds).
 * If you leave it out, only starting suspects are included.
 */
export async function loadPlayerCase(
  caseId: string,
  unlockedIds: string[] = []
): Promise<PlayerCase> {
  const master = await loadMasterCase(caseId);
  const playerCase = redactToPlayerCase(master, { unlockedIds });
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

/**
 * Combines everything that can unlock a suspect into one list.
 * Think of it as emptying two pockets (evidence + witnesses) into one bag.
 */
export function getUnlockedIds(investigation: {
  evidenceDiscovered: string[];
  witnessesInterviewed: string[];
}): string[] {
  return [
    ...investigation.evidenceDiscovered,
    ...investigation.witnessesInterviewed,
  ];
}
/**
 * The suspect board for a player: only suspects they have unlocked.
 * Safe to send to the browser (id, name, role only).
 */
export async function getSuspectBoard(
  caseId: string,
  unlockedIds: string[]
): Promise<{ id: string; name: string; role: string }[]> {
  const master = await loadMasterCase(caseId);
  const visible = getVisibleSuspectIds(master, unlockedIds);
  return master.suspects
    .filter((s) => visible.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, role: s.role }));
}