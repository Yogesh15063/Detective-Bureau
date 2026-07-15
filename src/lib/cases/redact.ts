import type { MasterCase, PlayerCase } from "@/types/case";

/**
 * Converts a MasterCase into a PlayerCase by stripping every field
 * that must never reach the AI narrator or the player.
 *
 * This is a safety boundary, not a convenience helper — treat it as
 * the single choke point all case data must pass through before
 * touching an AI prompt or an API response body.
 */
export function redactToPlayerCase(master: MasterCase): PlayerCase {
  const {
    solution, // NEVER expose
    hidden_truth, // NEVER expose
    case: masterCaseMeta,
    ...sharedBody
  } = master;

  const {
    design_intent, // master-only reasoning, drop
    pacing_guide, // master-only reasoning, drop
    note_to_ai_running_this_game, // master-only instructions, drop
    ...playerCaseMeta
  } = masterCaseMeta;

  const playerCase: PlayerCase = {
    ...sharedBody,
    case: {
      ...playerCaseMeta,
      note_for_player:
        "This is your case file. Every fact needed to identify the killer " +
        "beyond reasonable doubt is contained somewhere in this document or " +
        "discoverable through the listed in-game actions.",
    },
  };

  return playerCase;
}

/**
 * Basic sanity check: throws if a PlayerCase accidentally contains
 * any master-only key. Run this in dev/CI and before saving any
 * admin-uploaded case to the database.
 */
export function assertNoLeakage(playerCase: unknown): void {
  const json = JSON.stringify(playerCase);
  const forbiddenMarkers = [
    '"solution"',
    '"hidden_truth"',
    '"design_intent"',
    '"pacing_guide"',
    '"note_to_ai_running_this_game"',
    '"killer"',
    '"true_identity"',
    '"true_motive"',
  ];

  for (const marker of forbiddenMarkers) {
    if (json.includes(marker)) {
      throw new Error(
        `Leakage check failed: player case contains forbidden field ${marker}`
      );
    }
  }
}