import type { MasterCase, PlayerCase } from "@/types/case";
import { redactToPlayerCase, assertNoLeakage } from "./redact";

/**
 * Loads a case's master record and returns ONLY the redacted,
 * player-safe version. This is the single function the rest of the
 * app (API routes, AI narrator) should ever call to get case data
 * during actual gameplay.
 *
 * NOTE: DB wiring comes in the next step (lib/db). For now this
 * reads master.json directly from cases-data/master/ so we can test
 * the redaction logic end-to-end with your real Grey Harbor file.
 */
export async function loadPlayerCase(caseId: string): Promise<PlayerCase> {
  const master = await loadMasterCaseFromDisk(caseId);
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
  return loadMasterCaseFromDisk(caseId);
}

async function loadMasterCaseFromDisk(caseId: string): Promise<MasterCase> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const filePath = path.join(
    process.cwd(),
    "cases-data",
    "master",
    `${caseId}.json`
  );

  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as MasterCase;
}