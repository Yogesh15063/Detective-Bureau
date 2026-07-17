import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import type { PlayerCase } from "@/types/case";
import type { InvestigationDocument, ChatMessage } from "@/models/Investigation";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Using the "latest" alias instead of a pinned version — Google
// periodically retires specific model IDs (e.g. gemini-2.5-flash
// stopped being available to new API keys). This alias always points
// to Google's current-generation Flash model, so we don't have to
// chase deprecations manually. Currently resolves to gemini-3.5-flash.
const NARRATOR_MODEL = "gemini-flash-latest";

/**
 * The AI response is expected to end with a fenced JSON block describing
 * any state changes this turn (new evidence discovered, milestone flags
 * flipped, etc). Everything before that block is the in-character
 * narrative text shown to the player.
 */
export interface NarratorStateUpdate {
  evidence_discovered?: string[];
  locations_visited?: string[];
  witnesses_interviewed?: string[];
  suspects_interrogated?: string[];
  contradictions_presented?: { suspect_id: string; contradiction: string }[];
  milestone_flags?: Record<string, boolean>;
}

export interface NarratorResult {
  narrative: string;
  stateUpdate: NarratorStateUpdate;
}

function buildSystemPrompt(
  playerCase: PlayerCase,
  investigation: InvestigationDocument
): string {
  return `You are the narrator, every witness, every suspect, and every police/forensic contact in an immersive detective investigation simulator. The player is the detective.

# ABSOLUTE RULES
- You ONLY know what is in the CASE FILE below and what the player has already discovered (see PLAYER PROGRESS below). Never invent facts that contradict the case file. Never invent evidence that isn't in the case file.
- NEVER reveal the killer's identity, motive, or the solution directly. The player must reach conclusions through evidence.
- Only reveal a piece of information if the player's action logically justifies discovering it (visiting the right location, asking the right question, requesting the right forensic test, presenting the right contradiction). If the player's action doesn't justify new info, respond in-world with a realistic dead end, partial answer, or requirement (e.g. "you'd need a warrant for that").
- Stay perfectly in character for suspects/witnesses: they lie, deflect, or are truthful exactly as described in their case file entries. Do not break character to help the player.
- When the player asks for analysis, reconstruction, or to compare evidence (e.g. overlaying two locations, building a timeline), respond as an analytical case-file style report: use short headers, bullet points or numbered reconstructions, distances/times when calculable from the case file, and clearly state what is proven vs. still unresolved. Match this tone:

Example of the analytical style to emulate:
"Distance: The Kestrel Cannery Outflow Dock is approximately 1 mile up the shoreline road from the Grey Harbor Town Dock. What This Means: Based on evidence collected so far, the current reconstruction is: 1. [step] 2. [step]... The investigation has not yet established [specific open question]."

- For direct conversation/interrogation, respond as that character naturally would — no headers, just dialogue and scene description.
- Never mention "evidence IDs," JSON, game mechanics, or anything meta. The player only sees natural narrative text.

# CASE FILE (player-safe version — this is everything you are allowed to know)
${JSON.stringify(playerCase)}

# PLAYER PROGRESS SO FAR
- Locations visited: ${investigation.locationsVisited.join(", ") || "none"}
- Evidence discovered: ${investigation.evidenceDiscovered.join(", ") || "none"}
- Witnesses interviewed: ${investigation.witnessesInterviewed.join(", ") || "none"}
- Suspects interrogated: ${investigation.suspectsInterrogated.join(", ") || "none"}
- Forensic tests requested: ${investigation.forensicTestsRequested.join(", ") || "none"}
- Warrants obtained: ${investigation.warrantsObtained.join(", ") || "none"}
- Milestone flags: ${JSON.stringify(investigation.milestoneFlags)}

# RESPONSE FORMAT (strict)
Write your in-character/narrative response first, exactly as the player should see it.
Then, on a new line, output a fenced json block with ONLY the state changes THIS turn caused (omit fields with no change, use empty arrays/objects if nothing changed):

\`\`\`json
{
  "evidence_discovered": [],
  "locations_visited": [],
  "witnesses_interviewed": [],
  "suspects_interrogated": [],
  "contradictions_presented": [],
  "milestone_flags": {}
}
\`\`\`

The json block is never shown to the player — it is parsed by the game engine. Always include it, even if everything is empty.`;
}

function toGeminiContents(history: ChatMessage[], newPlayerMessage: string) {
  // Gemini uses "user" / "model" roles (not "assistant"), and each turn
  // is { role, parts: [{ text }] } rather than a flat content string.
  const contents = history.map((m) => ({
    role: (m.role === "player" ? "user" : "model") as "user" | "model",
    parts: [{ text: m.content }],
  }));
  contents.push({ role: "user", parts: [{ text: newPlayerMessage }] });
  return contents;
}

function parseNarratorResponse(raw: string): NarratorResult {
  const jsonBlockMatch = raw.match(/```json\s*([\s\S]*?)```/);

  if (!jsonBlockMatch) {
    // Model failed to include the state block — treat whole response as
    // narrative, no state changes. Caller should log this as a warning.
    return { narrative: raw.trim(), stateUpdate: {} };
  }

  const narrative = raw.slice(0, jsonBlockMatch.index).trim();
  let stateUpdate: NarratorStateUpdate = {};

  try {
    stateUpdate = JSON.parse(jsonBlockMatch[1]);
  } catch {
    stateUpdate = {};
  }

  return { narrative, stateUpdate };
}

export async function runNarratorTurn(
  playerCase: PlayerCase,
  investigation: InvestigationDocument,
  playerMessage: string
): Promise<NarratorResult> {
  const systemPrompt = buildSystemPrompt(playerCase, investigation);
  const contents = toGeminiContents(
    investigation.conversationHistory,
    playerMessage
  );

  const response = await ai.models.generateContent({
    model: NARRATOR_MODEL,
    contents,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 1500,
      // Gemini 3.x models "think" before responding by default (medium
      // level), which adds significant latency. For a fast-turn chat
      // game, low is a better fit — bump to "medium" later if you find
      // the narrator's reasoning/consistency suffers.
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
    },
  });

  const rawText = response.text ?? "";

  return parseNarratorResponse(rawText);
}