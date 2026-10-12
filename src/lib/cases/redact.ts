import type { MasterCase, PlayerCase, Suspect } from "@/types/case";

const MASK = "Unknown party";

/* ---------- Suspect visibility ---------- */

function isSuspectVisible(s: Suspect, unlocked: Set<string>): boolean {
  if (s.starts_visible) return true;
  // Old cases with no reveal rules: visible from the start
  if (!s.revealed_by || s.revealed_by.length === 0) return true;
  return s.revealed_by.some((id) => unlocked.has(id));
}

export function getVisibleSuspectIds(
  master: MasterCase,
  unlockedIds: string[]
): Set<string> {
  const unlocked = new Set(unlockedIds);
  return new Set(
    master.suspects.filter((s) => isSuspectVisible(s, unlocked)).map((s) => s.id)
  );
}

/** Suspects that became visible between two states (for narrator + toast). */
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

/* ---------- Masking helpers (work on ANY data shape) ---------- */

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function maskText(text: string, hidden: Suspect[]): string {
  let out = text;
  for (const h of hidden) {
    for (const token of [h.name, h.id]) {
      if (token) {
        out = out.replace(
          new RegExp(`\\b${escapeRegExp(token)}\\b`, "gi"),
          MASK
        );
      }
    }
  }
  return out;
}

/** Walks any value (string / list / object) and masks hidden names inside it. */
function maskDeep<T>(value: T, hidden: Suspect[]): T {
  if (typeof value === "string") {
    return maskText(value, hidden) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => maskDeep(v, hidden)) as unknown as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        maskText(k, hidden),
        maskDeep(v, hidden),
      ])
    ) as T;
  }
  return value;
}

function touchesHidden(value: string, hidden: Suspect[]): boolean {
  const v = value.toLowerCase();
  return hidden.some(
    (h) => v.includes(h.name.toLowerCase()) || v === h.id.toLowerCase()
  );
}

/* ---------- Main redaction ---------- */

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

  const visibleIds = getVisibleSuspectIds(master, opts.unlockedIds ?? []);
  const hidden = master.suspects.filter((s) => !visibleIds.has(s.id));

  // 1. Suspects: drop hidden ones, strip the unlock rules themselves
  const suspects = master.suspects
    .filter((s) => visibleIds.has(s.id))
    .map(({ revealed_by, starts_visible, ...rest }) => rest);

  // 2. Interrogations: only for visible suspects (any shape tolerated)
  const ir: unknown = master.interrogations;
  const interrogations = (
    ir && typeof ir === "object" && !Array.isArray(ir)
      ? maskDeep(
          Object.fromEntries(
            Object.entries(ir as Record<string, unknown>).filter(([key]) => {
              const owner = master.suspects.find(
                (s) => s.id === key || s.name === key
              );
              return !owner || visibleIds.has(owner.id);
            })
          ),
          hidden
        )
      : maskDeep(ir, hidden)
  ) as PlayerCase["interrogations"];

  // 3. Relationship graph: list of edges -> drop edges touching hidden people;
  //    any other shape -> mask hidden names inside it
  const rg: unknown = master.relationship_graph;
  const relationship_graph = (
    Array.isArray(rg)
      ? rg.filter(
          (e) =>
            !touchesHidden(String(e?.from ?? ""), hidden) &&
            !touchesHidden(String(e?.to ?? ""), hidden)
        )
      : maskDeep(rg, hidden)
  ) as PlayerCase["relationship_graph"];

  // 4. Records that name people: mask hidden names, whatever the shape
  const phone_calls = maskDeep(master.phone_calls, hidden);
  const messages = maskDeep(master.messages, hidden);
  const emails = maskDeep(master.emails, hidden);
  const vehicles = maskDeep(master.vehicles, hidden);
  const bank_records = maskDeep(master.bank_records, hidden);

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

/* ---------- Leak checks ---------- */

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
    '"revealed_by"',
    '"starts_visible"',
  ];
  for (const marker of forbiddenMarkers) {
    if (json.includes(marker)) {
      throw new Error(
        `Leakage check failed: player case contains forbidden field ${marker}`
      );
    }
  }
}

/** For case authoring: warns if a hidden suspect's name still appears in player data. */
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