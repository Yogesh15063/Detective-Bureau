"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

// Must match OPENING_TRIGGER in src/lib/ai/narrator.ts exactly.
const OPENING_TRIGGER =
  "__BEGIN_CASE__ (This is not something the player said. Open the investigation with a vivid, atmospheric scene-setting narration of the detective arriving at the case — sensory, in-world, 2-3 short paragraphs — ending in a way that naturally invites the detective's first move. Do not treat this line as player dialogue.)";

interface NamedEntity {
  id: string;
  name: string;
  role?: string;
}

interface ChatMessage {
  role: "player" | "narrator";
  content: string;
}

interface Progress {
  evidenceDiscovered: string[];
  locationsVisited: string[];
  witnessesInterviewed: string[];
  suspectsInterrogated: string[];
}

interface Verdict {
  correct: boolean;
  concluded: boolean;
  attemptsRemaining: number;
  actualKiller: string | null;
  verdict: {
    howItHappened: string;
    trueMotive: string;
    fullNarrative: string;
  } | null;
}

export default function InvestigatePage() {
  const params = useParams();
  const caseId = params.caseId as string;

  const [loading, setLoading] = useState(true);
  const [caseTitle, setCaseTitle] = useState("");
  const [suspects, setSuspects] = useState<NamedEntity[]>([]);
  const [witnesses, setWitnesses] = useState<NamedEntity[]>([]);
  const [locations, setLocations] = useState<NamedEntity[]>([]);
  const [targetEvidence, setTargetEvidence] = useState(0);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [progress, setProgress] = useState<Progress>({
    evidenceDiscovered: [],
    locationsVisited: [],
    witnessesInterviewed: [],
    suspectsInterrogated: [],
  });
  const [caseStatus, setCaseStatus] = useState<
    "in_progress" | "accused_correct" | "cold"
  >("in_progress");

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [showAccuse, setShowAccuse] = useState(false);
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [accusing, setAccusing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/cases/${caseId}`);
      if (!res.ok) {
        setErrorMsg("That file doesn't exist in Bureau records.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCaseTitle(data.case.title);
      setSuspects(data.suspects);
      setWitnesses(data.witnesses);
      setLocations(data.locations);
      setTargetEvidence(data.case.target_evidence_count);

      if (data.existingProgress) {
        setProgress({
          evidenceDiscovered: data.existingProgress.evidenceDiscovered,
          locationsVisited: data.existingProgress.locationsVisited,
          witnessesInterviewed: data.existingProgress.witnessesInterviewed,
          suspectsInterrogated: data.existingProgress.suspectsInterrogated,
        });
        setCaseStatus(data.existingProgress.status);
        setMessages(
          data.existingProgress.conversationHistory
            .filter((m: { content: string }) => m.content !== OPENING_TRIGGER)
            .map((m: { role: string; content: string }) => ({
              role: m.role,
              content: m.content,
            }))
        );
      }
      setLoading(false);

      // Brand new investigation (never played before) — automatically
      // kick off an atmospheric opening scene instead of showing a
      // blank "what would you like to investigate?" placeholder.
      if (!data.existingProgress) {
        sendMessage(OPENING_TRIGGER, { hidden: true });
      }
    }
    load();
  }, [caseId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function sendMessage(
    overrideMessage?: string,
    opts?: { hidden?: boolean }
  ) {
    const playerMessage = overrideMessage ?? input.trim();
    if (!playerMessage || sending || caseStatus !== "in_progress") return;
    if (!overrideMessage) setInput("");
    setErrorMsg(null);
    if (!opts?.hidden) {
      setMessages((m) => [...m, { role: "player", content: playerMessage }]);
    }
    setSending(true);

    try {
      const res = await fetch(`/api/investigation/${caseId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: playerMessage }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "The file didn't come through. Try again in a moment, Detective.");
        setSending(false);
        return;
      }

      setMessages((m) => [...m, { role: "narrator", content: data.narrative }]);
      setProgress({
        evidenceDiscovered: data.progress.evidenceDiscovered,
        locationsVisited: data.progress.locationsVisited,
        witnessesInterviewed: data.progress.witnessesInterviewed,
        suspectsInterrogated: data.progress.suspectsInterrogated,
      });
    } catch {
      setErrorMsg("The file didn't come through. Try again in a moment, Detective.");
    } finally {
      setSending(false);
    }
  }

  async function submitAccusation() {
    if (!selectedSuspect || accusing) return;
    setAccusing(true);
    try {
      const res = await fetch(`/api/investigation/${caseId}/accuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspectId: selectedSuspect }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "The accusation didn't file. Try again.");
        setAccusing(false);
        return;
      }
      setVerdict(data);
      if (data.concluded) {
        setCaseStatus(data.correct ? "accused_correct" : "cold");
      }
    } catch {
      setErrorMsg("The accusation didn't file. Try again.");
    } finally {
      setAccusing(false);
    }
  }

  const nameOf = (list: NamedEntity[], id: string) =>
    list.find((x) => x.id === id)?.name ?? id;

  if (loading) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="font-mono text-sm text-fog">Pulling the file…</p>
      </div>
    );
  }

  if (errorMsg && messages.length === 0 && !caseTitle) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="font-mono text-sm text-fog">{errorMsg}</p>
      </div>
    );
  }

  const concluded = caseStatus !== "in_progress";

  return (
    <div className="min-h-screen bg-ink text-parchment flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-ink">
        <div className="flex items-center gap-4">
          <Link href="/cases" className="text-fog hover:text-parchment text-sm">
            ←
          </Link>
          <h1 className="font-display uppercase text-lg tracking-wide">
            {caseTitle}
          </h1>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] text-fog tracking-wider">
            CASE PROGRESS
          </p>
          <p className="font-mono text-sm text-brass">
            {progress.evidenceDiscovered.length} / {targetEvidence}
          </p>
        </div>
      </header>

      <div className="flex-1 grid md:grid-cols-[1fr_320px] overflow-hidden">
        {/* CHAT */}
        <div className="flex flex-col overflow-hidden border-r border-white/10">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {messages.length === 0 && (
              <p className="font-mono text-sm text-fog">
                Opening the file…
              </p>
            )}
            {messages.map((m, i) =>
              m.role === "player" ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-brass/15 border border-brass/30 rounded px-4 py-2.5 max-w-[80%]">
                    <p className="font-mono text-sm text-parchment">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="max-w-[85%]">
                  <p className="text-parchment/90 text-[15px] leading-relaxed whitespace-pre-wrap">
                    {m.content}
                  </p>
                </div>
              )
            )}
            {sending && (
              <div className="flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-fog animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-fog animate-pulse [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-fog animate-pulse [animation-delay:300ms]" />
              </div>
            )}
            {errorMsg && (
              <p className="font-mono text-xs text-rust">{errorMsg}</p>
            )}
            {concluded && (
              <div className="border border-brass/40 rounded p-4 bg-charcoal">
                <p className="font-mono text-xs text-brass tracking-wide">
                  {caseStatus === "accused_correct"
                    ? "CASE CLOSED — YOU NAMED THE KILLER."
                    : "CASE CLOSED — THE FILE HAS GONE COLD."}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-4 flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={sending || concluded}
              placeholder={
                concluded
                  ? "This file is closed."
                  : "What would you like to investigate?"
              }
              className="flex-1 bg-charcoal border border-white/10 rounded px-4 py-2.5 text-sm font-mono text-parchment placeholder:text-fog/60 focus:outline-none focus:border-brass/50 disabled:opacity-50"
            />
           <button
  onClick={() => sendMessage()}
  disabled={sending || concluded || !input.trim()}
  className="bg-brass text-parchment font-medium text-sm px-6 rounded hover:bg-brass-dim transition-colors disabled:opacity-40"
>
  Send
</button>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="overflow-y-auto p-5 space-y-6 bg-charcoal/40">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-brass mb-2">
              LOCATIONS SEARCHED
            </p>
            {progress.locationsVisited.length === 0 ? (
              <p className="text-xs text-fog font-mono">None yet.</p>
            ) : (
              <ul className="space-y-1">
                {progress.locationsVisited.map((id) => (
                  <li key={id} className="text-xs text-parchment/80">
                    {nameOf(locations, id)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-widest text-brass mb-2">
              EVIDENCE DISCOVERED
            </p>
            {progress.evidenceDiscovered.length === 0 ? (
              <p className="text-xs text-fog font-mono">None yet.</p>
            ) : (
              <ul className="space-y-1">
                {progress.evidenceDiscovered.map((id) => (
                  <li key={id} className="text-xs font-mono text-parchment/80">
                    {id}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-widest text-brass mb-2">
              WITNESSES INTERVIEWED
            </p>
            {progress.witnessesInterviewed.length === 0 ? (
              <p className="text-xs text-fog font-mono">None yet.</p>
            ) : (
              <ul className="space-y-1">
                {progress.witnessesInterviewed.map((id) => (
                  <li key={id} className="text-xs text-parchment/80">
                    {nameOf(witnesses, id)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-widest text-brass mb-2">
              SUSPECTS INTERROGATED
            </p>
            {progress.suspectsInterrogated.length === 0 ? (
              <p className="text-xs text-fog font-mono">None yet.</p>
            ) : (
              <ul className="space-y-1">
                {progress.suspectsInterrogated.map((id) => (
                  <li key={id} className="text-xs text-parchment/80">
                    {nameOf(suspects, id)}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={() => setShowAccuse(true)}
            disabled={concluded}
            className="w-full bg-rust text-parchment font-medium text-sm py-3 rounded hover:bg-rust/80 transition-colors disabled:opacity-40"
          >
            File an Accusation
          </button>
        </aside>
      </div>

      {/* ACCUSATION MODAL */}
      {showAccuse && !verdict && (
        <div className="fixed inset-0 bg-ink/90 flex items-center justify-center z-30 p-6">
          <div className="bg-charcoal border border-white/10 rounded-lg max-w-md w-full p-6">
            <h2 className="font-display uppercase text-xl mb-2">Name Your Suspect</h2>
            <p className="text-xs text-fog font-mono mb-5">
              An accusation is final. Two wrong guesses and this file goes cold.
            </p>
            <div className="space-y-2 mb-6">
              {suspects.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 border rounded px-3 py-2.5 cursor-pointer ${
                    selectedSuspect === s.id
                      ? "border-brass bg-brass/10"
                      : "border-white/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="suspect"
                    checked={selectedSuspect === s.id}
                    onChange={() => setSelectedSuspect(s.id)}
                    className="accent-brass"
                  />
                  <span className="text-sm">{s.name}</span>
                  <span className="text-xs text-fog ml-auto">{s.role}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAccuse(false)}
                className="flex-1 border border-white/10 text-sm py-2.5 rounded hover:bg-white/5"
              >
                Keep Investigating
              </button>
              <button
                onClick={submitAccusation}
                disabled={!selectedSuspect || accusing}
                className="flex-1 bg-rust text-parchment text-sm py-2.5 rounded hover:bg-rust/80 disabled:opacity-40"
              >
                {accusing ? "Filing…" : "File the Accusation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERDICT */}
      {verdict && (
        <div className="fixed inset-0 bg-ink/95 flex items-center justify-center z-30 p-6 overflow-y-auto">
          <div className="bg-charcoal border border-white/10 rounded-lg max-w-lg w-full p-7 my-10">
            <h2 className="font-display uppercase text-2xl mb-4">
              {verdict.correct
                ? "Case Closed. You Named the Killer."
                : verdict.concluded
                ? "Case Closed. The File Has Gone Cold."
                : `Wrong. ${verdict.attemptsRemaining} Attempt Remaining.`}
            </h2>
            {verdict.verdict && (
              <>
                <p className="text-sm text-parchment/85 leading-relaxed mb-4">
                  {verdict.verdict.howItHappened}
                </p>
                <p className="font-mono text-xs text-fog mb-6">
                  Killer: {verdict.actualKiller}
                </p>
              </>
            )}
            <button
              onClick={() => {
                setShowAccuse(false);
                setVerdict(null);
              }}
              className="w-full bg-brass text-parchment text-sm py-2.5 rounded hover:bg-brass-dim"
            >
              {verdict.concluded ? "Return to the Archive" : "Keep Investigating"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}