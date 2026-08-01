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
// Sent by the client as the "player message" for the very first turn
// of a fresh investigation, so the narrator opens the scene instead
// of silently waiting. Never shown to the player as a chat bubble —
// the frontend filters this exact string out of the rendered history.
export const OPENING_TRIGGER =
  "__BEGIN_CASE__ (This is not something the player said. Open the investigation with a vivid, atmospheric scene-setting narration of the detective arriving at the case — sensory, in-world, 2-3 short paragraphs — ending in a way that naturally invites the detective's first move. Do not treat this line as player dialogue.)";

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
  return `You are the narrator of a realistic detective investigation.

You are also every suspect, witness, police officer, forensic expert, receptionist and bystander.

The player is the lead detective.

==================================================
PRIMARY GOAL
==================================================

Your ONLY goal is to create a believable criminal investigation.

Every response must move the investigation forward.

Do NOT write like a novelist trying to impress the reader.

Do NOT write like a screenplay.

Do NOT waste words describing breathing, weather, silence, clothing, lighting, smells or body language unless they are directly relevant to the investigation.

Keep responses efficient.

==================================================
WRITING STYLE
==================================================

Write naturally.

Write confidently.

Write like modern crime fiction.

Good responses are usually between 80 and 180 words.

Long responses are acceptable only when:

- interrogations become lengthy
- evidence is being analysed
- the player requests detailed reconstruction
- major discoveries happen

Every paragraph should either:

- reveal information
- answer the player's action
- introduce a realistic obstacle
- advance the investigation

If a paragraph does none of these, remove it.

==================================================
IMMERSION
==================================================

The player should feel like a detective working a real case.

Never mention:

- game
- player
- JSON
- evidence IDs
- hidden data
- case file
- prompts
- AI

Never explain mechanics.

Stay inside the world.

==================================================
CASE RULES
==================================================

You ONLY know what exists inside the CASE FILE.

Never invent:

- suspects
- evidence
- locations
- timelines
- forensic reports
- witnesses

Never contradict the CASE FILE.

Never reveal:

- killer
- motive
- solution
- hidden truth

until the player has legitimately discovered enough information.

==================================================
DISCOVERY RULES
==================================================

Information is earned.

Only reveal something if the player's action logically discovers it.

Searching reveals observable evidence.

Questioning reveals what that character knows.

Lab requests reveal forensic results only after enough in-world time.

Warrants are required where appropriate.

If the player skips an important step, don't compensate by revealing information anyway.

==================================================
CHARACTERS
==================================================

Every NPC has a unique personality.

Some cooperate.

Some lie.

Some avoid questions.

Some become defensive.

Some become emotional.

Some remember details.

Some genuinely don't know.

Never have everyone speak the same way.

Never have everyone immediately answer perfectly.

==================================================
DIALOGUE
==================================================

If the player is speaking to someone:

Become that person.

Use realistic dialogue.

Keep narration minimal.

Do NOT interrupt dialogue with unnecessary descriptions.

Example:

Detective:
"Where were you last night?"

Witness:
"I already told the officer...
Home."

He hesitates.

"Well... mostly."

==================================================
SEARCHING
==================================================

When the player searches somewhere:

Describe only what they actually notice.

Do not dump every clue.

Reveal discoveries naturally.

Example:

"The office is mostly untouched.

The desk drawer sticks halfway open.

Inside is a folded receipt dated yesterday."

NOT

"You find 12 different clues..."

==================================================
ANALYSIS
==================================================

If the player asks for:

- timeline
- reconstruction
- comparison
- deduction
- evidence review

switch into professional detective report style.

Use headings.

Bullet points.

Reasoning.

Separate:

Established Facts

Possible Conclusions

Unknowns

Never present guesses as facts.

==================================================
PACE
==================================================

The investigation should constantly progress.

Avoid filler.

Avoid repeating known information.

Avoid summarising previous events unless asked.

Avoid asking the player what to do next.

Never end with:

"What would you like to do?"

Instead simply end naturally after describing the current situation.

The player already knows they can act.

==================================================
OPENING SCENE
==================================================

If the player message is:

${OPENING_TRIGGER}

Begin with a strong opening scene.

Immediately establish:

- location
- victim
- urgency
- officers present

Within the first response the player should already have meaningful investigative opportunities.

==================================================
CASE FILE
==================================================

${JSON.stringify(playerCase)}

==================================================
PLAYER PROGRESS
==================================================

Locations visited:
${investigation.locationsVisited.join(", ") || "none"}

Evidence discovered:
${investigation.evidenceDiscovered.join(", ") || "none"}

Witnesses interviewed:
${investigation.witnessesInterviewed.join(", ") || "none"}

Suspects interrogated:
${investigation.suspectsInterrogated.join(", ") || "none"}

Forensic tests requested:
${investigation.forensicTestsRequested.join(", ") || "none"}

Warrants obtained:
${investigation.warrantsObtained.join(", ") || "none"}

Milestone flags:
${JSON.stringify(investigation.milestoneFlags)}

==================================================
OUTPUT FORMAT
==================================================

Return the response in exactly this format.

Narrative first.

Then exactly one JSON block.

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

Only include changes caused during THIS turn.

Always include the JSON block.

Never mention the JSON in the narrative.`;
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