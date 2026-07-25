import { Schema, model, models, type Document } from "mongoose";

/**
 * One document per (player, case) pair. This is the living game
 * state — separate from the static Case document. Everything the
 * AI narrator needs to know about "what has this player discovered
 * so far" lives here.
 */

export interface ChatMessage {
  role: "player" | "narrator";
  content: string;
  timestamp: Date;
}

export interface InvestigationDocument extends Document {
  userId: string; // Clerk user id (placeholder string until auth step)
  caseId: string; // matches Case.caseId
  // "cold": two failed accusations used up. Investigating/accusing is
  // blocked until a future "reopen the file" mechanic is added.
  status: "in_progress" | "accused_correct" | "cold";
  wrongAccusationCount: number;

  // Mirrors game_state_template.player_progress shape from the case file,
  // but this is the LIVE, mutable copy for this specific player.
  locationsVisited: string[];
  locationsResearchedSecondPass: string[];
  evidenceDiscovered: string[];
  forensicTestsRequested: string[];
  warrantsObtained: string[];
  witnessesInterviewed: string[];
  witnessesReinterviewed: string[];
  suspectsInterrogated: string[];
  contradictionsPresentedToSuspects: Record<string, string[]>;
  milestoneFlags: Record<string, boolean>; // per-case custom flags (open-ended)

  conversationHistory: ChatMessage[];

  accusedSuspectId: string | null;
  accusationCorrect: boolean | null;

  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    role: { type: String, enum: ["player", "narrator"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const InvestigationSchema = new Schema<InvestigationDocument>(
  {
    userId: { type: String, required: true, index: true },
    caseId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["in_progress", "accused_correct", "cold"],
      default: "in_progress",
    },
    wrongAccusationCount: { type: Number, default: 0 },

    locationsVisited: { type: [String], default: [] },
    locationsResearchedSecondPass: { type: [String], default: [] },
    evidenceDiscovered: { type: [String], default: [] },
    forensicTestsRequested: { type: [String], default: [] },
    warrantsObtained: { type: [String], default: [] },
    witnessesInterviewed: { type: [String], default: [] },
    witnessesReinterviewed: { type: [String], default: [] },
    suspectsInterrogated: { type: [String], default: [] },
    contradictionsPresentedToSuspects: {
      type: Schema.Types.Mixed,
      default: {},
    },
    milestoneFlags: { type: Schema.Types.Mixed, default: {} },

    conversationHistory: { type: [ChatMessageSchema], default: [] },

    accusedSuspectId: { type: String, default: null },
    accusationCorrect: { type: Boolean, default: null },
  },
  { timestamps: true }
);

// One investigation per (user, case) pair
InvestigationSchema.index({ userId: 1, caseId: 1 }, { unique: true });

export const Investigation =
  models.Investigation ||
  model<InvestigationDocument>("Investigation", InvestigationSchema);