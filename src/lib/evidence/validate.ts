import type { PlayerCase } from "@/types/case";
import type { InvestigationDocument } from "@/models/Investigation";
import type { NarratorStateUpdate } from "@/lib/ai/narrator";

/**
 * The AI narrator self-reports what it thinks unlocked this turn, but
 * it's still an LLM — it can hallucinate an evidence id that doesn't
 * exist, or claim something unlocked before its prerequisites were
 * actually found. This module is the ground-truth check that runs
 * BEFORE we ever merge that report into the database.
 *
 * Nothing here talks to the AI — it only compares against the
 * player-safe case file, which is data we already trust.
 */

export interface ValidationWarning {
  type:
    | "unknown_evidence_id"
    | "unknown_location_id"
    | "unknown_witness_id"
    | "unknown_suspect_id"
    | "missing_prerequisite";
  id: string;
  detail?: string;
}

export interface ValidatedStateUpdate {
  stateUpdate: NarratorStateUpdate;
  warnings: ValidationWarning[];
}

function idSet<T>(items: T[], getId: (item: T) => string): Set<string> {
  return new Set(items.map(getId));
}

/**
 * LLMs don't always follow the requested JSON shape exactly — a field
 * that should be an array can come back as a string, an object, or be
 * missing. This coerces safely to an array instead of crashing.
 */
function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Filters a raw narrator state update down to only entries that are
 * real (exist in the case file) and, for evidence, whose prerequisites
 * (linked_evidence) have already been discovered or are being
 * discovered in this same turn.
 */
export function validateStateUpdate(
  playerCase: PlayerCase,
  investigation: InvestigationDocument,
  raw: NarratorStateUpdate
): ValidatedStateUpdate {
  const warnings: ValidationWarning[] = [];

  const validEvidenceIds = idSet(playerCase.evidence, (e) => e.id);
  const validLocationIds = idSet(playerCase.locations, (l) => l.id);
  const validWitnessIds = idSet(playerCase.witnesses, (w) => w.id);
  const validSuspectIds = idSet(playerCase.suspects, (s) => s.id);

  const alreadyDiscovered = new Set(investigation.evidenceDiscovered);
  const claimedThisTurn = new Set(asArray<string>(raw.evidence_discovered));

  // --- Evidence: existence + prerequisite check ---
  const evidence_discovered = asArray<string>(raw.evidence_discovered).filter((id) => {
    const item = playerCase.evidence.find((e) => e.id === id);
    if (!item) {
      warnings.push({ type: "unknown_evidence_id", id });
      return false;
    }

    const prerequisites = item.linked_evidence ?? [];
    const unmet = prerequisites.filter(
      (depId) => !alreadyDiscovered.has(depId) && !claimedThisTurn.has(depId)
    );

    if (unmet.length > 0) {
      warnings.push({
        type: "missing_prerequisite",
        id,
        detail: `Missing prerequisite(s): ${unmet.join(", ")}`,
      });
      return false;
    }

    return true;
  });

  // --- Locations / witnesses / suspects: existence check only ---
  const locations_visited = asArray<string>(raw.locations_visited).filter((id) => {
    const ok = validLocationIds.has(id);
    if (!ok) warnings.push({ type: "unknown_location_id", id });
    return ok;
  });

  const witnesses_interviewed = asArray<string>(raw.witnesses_interviewed).filter(
    (id) => {
      const ok = validWitnessIds.has(id);
      if (!ok) warnings.push({ type: "unknown_witness_id", id });
      return ok;
    }
  );

  const suspects_interrogated = asArray<string>(raw.suspects_interrogated).filter(
    (id) => {
      const ok = validSuspectIds.has(id);
      if (!ok) warnings.push({ type: "unknown_suspect_id", id });
      return ok;
    }
  );

  const contradictions_presented = asArray<{
    suspect_id: string;
    contradiction: string;
  }>(raw.contradictions_presented).filter((c) => {
    if (!c || typeof c !== "object" || !c.suspect_id) {
      warnings.push({ type: "unknown_suspect_id", id: String(c) });
      return false;
    }
    const ok = validSuspectIds.has(c.suspect_id);
    if (!ok) warnings.push({ type: "unknown_suspect_id", id: c.suspect_id });
    return ok;
  });

  return {
    stateUpdate: {
      evidence_discovered,
      locations_visited,
      witnesses_interviewed,
      suspects_interrogated,
      contradictions_presented,
      milestone_flags: raw.milestone_flags, // per-case custom, can't validate generically
    },
    warnings,
  };
}