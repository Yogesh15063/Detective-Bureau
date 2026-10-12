import type { MasterCase, PlayerCase, Suspect } from "@/types/case";

const MASK = "Unknown party";

/* ------------------------------------------------------------------ */
/* Suspect visibility                                                  */
/* ------------------------------------------------------------------ */

function isSuspectVisible(s: Suspect, unlocked: Set<string>): boolean {
  if (s.starts_visible) return true;
  // Legacy cases with no reveal rules: visible from the start
  if (!s.revealed_by || s.revealed_by.length === 0) return true;
  return s.revealed_by.some((id) => unlocked.has(id));
}

/**
 * unlockedIds = evidence IDs found + witness IDs interviewed.
 * (Anything a suspect's `revealed_by` can point to.)
 */
export function getVisibleSuspectIds(
  master: MasterCase,
  unlockedIds: string[]
): Set<string> {
  const unlocked = new Set(unlockedIds);
  return new Set(
    master.suspects.filter((s) => isSuspectVisible(s, unlocked)).map((s) => s.id)
  );
}

/** Suspects that became visible between two states (for the narrator + toast). */
export function getNewlyUnlockedSuspects(
  master: MasterCase,
  beforeIds: string[],
  afterIds: string[]
): { id: string; name: string; role: string }[] {
  const before = getVisibleSuspectIds(master, beforeIds);
  const after = getVisibleSuspectIds(master, afterIds);
  return master.suspects
    .filter((s) => after.has(s.id) && !before.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, role: s.role }));
}

/* ------------------------------------------------------------------ */
/* Masking helpers                                                     */
/* ------------------------------------------------------------------ */

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maskText(text: string, hidden: Suspect[]): string {
  let out = text;
  for (const h of hidden) {
    for (const token of [h.name, h.id]) {
      if (token) out = out.replace(new RegExp(escapeRegExp(token), "gi"), MASK);
    }
  }
  return out;
}

function touchesHidden(value: string, hidden: Suspect[]): boolean {
  const v = value.toLowerCase();
  return hidden.some(
    (h) => v.includes(h.name.toLowerCase()) || v === h.id.toLowerCase()
  );
}

/* ------------------------------------------------------------------ */
/* Main redaction                                                      */
/* ------------------------------------------------------------------ */

export function redactToPlayerCase(
  master: MasterCase,
  opts: { unlockedIds?: string[] } = {}
): PlayerCase {
  const {
    solution, // NEVER expose
    hidden_truth, // NEVER expose
    case: masterCaseMeta,
    ...sharedBody
  } = master;

  const {
    design_intent,
    pacing_guide,
    note_to_ai_running_this_game,
    ...playerCaseMeta
  } = masterCaseMeta;

  // Secure by default: no unlocked IDs = only starting suspects visible
  const visibleIds = getVisibleSuspectIds(master, opts.unlockedIds ?? []);
  const hidden = master.suspects.filter((s) => !visibleIds.has(s.id));

  // 1. Suspects: drop hidden ones, strip the unlock rules themselves
  const suspects = master.suspects
    .filter((s) => visibleIds.has(s.id))
    .map(({ revealed_by, starts_visible, ...rest }) => rest);

  // 2. Interrogations: only for visible suspects
  const interrogations = Object.fromEntries(
    Object.entries(master.interrogations).filter(([key]) => {
      const owner = master.suspects.find((s) => s.id === key || s.name === key);
      return !owner || visibleIds.has(owner.id);
    })
  );

  // 3. Relationship graph: drop edges touching a hidden suspect
  const relationship_graph = master.relationship_graph.filter(
    (e) => !touchesHidden(e.from, hidden) && !touchesHidden(e.to, hidden)
  );

  // 4. Mask names in records that name people
  const phone_calls = master.phone_calls.map((c) => ({
    ...c,
    from: maskText(c.from, hidden),
    to: maskText(c.to, hidden),
    content_summary: maskText(c.content_summary, hidden),
  }));
  const messages = master.messages.map((m) => ({
    ...m,
    from: maskText(m.from, hidden),
    to: maskText(m.to, hidden),
    text: maskText(m.text, hidden),
  }));
  const emails = master.emails.map((e) => ({
    ...e,
    from: maskText(e.from, hidden),
    to: maskText(e.to, hidden),
    content_summary: maskText(e.content_summary, hidden),
  }));
  const vehicles = master.vehicles.map((v) => ({
    ...v,
    owner: maskText(v.owner, hidden),
  }));
  const bank_records = master.bank_records.map((b) => ({
    ...b,
    account_holder: maskText(b.account_holder, hidden),
  }));

  return {
    ...sharedBody,
    suspects,
    interrogations,
    relationship_graph,
    phone_calls,
    messages,
    emails,
    vehicles,
    bank_records,
    case: {
      ...playerCaseMeta,
      note_for_player:
        "This is your case file. Every fact needed to identify the killer " +
        "beyond reasonable doubt is contained somewhere in this document or " +
        "discoverable through the listed in-game actions.",
    },
  };
}

/* ------------------------------------------------------------------ */
/* Leak checks                                                         */
/* ------------------------------------------------------------------ */

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
    '"revealed_by"', // NEW
    '"starts_visible"', // NEW
  ];
  for (const marker of forbiddenMarkers) {
    if (json.includes(marker)) {
      throw new Error(
        `Leakage check failed: player case contains forbidden field ${marker}`
      );
    }
  }
}

/**
 * Case-authoring check: finds hidden suspect names still sitting in
 * free text (timeline, witness statements, etc). Returns warnings
 * instead of throwing, since some mentions are fixed by rewriting
 * the case text, not by code.
 */
export function findHiddenNameMentions(
  master: MasterCase,
  playerCase: PlayerCase
): string[] {
  const visible = new Set(playerCase.suspects.map((s) => s.id));
  const json = JSON.stringify(playerCase).toLowerCase();
  return master.suspects
    .filter((s) => !visible.has(s.id) && json.includes(s.name.toLowerCase()))
    .map((s) => `Hidden suspect "${s.name}" is still mentioned in player data`);
}