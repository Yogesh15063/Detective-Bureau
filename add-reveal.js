const fs = require("fs");

const CLOSE =
  /(brother|sister|wife|husband|spouse|partner|\bson\b|daughter|family|relative|colleague|employer|boss|co-owner|roommate|girlfriend|boyfriend|\bex-)/i;
const MIN_VISIBLE = 2;
const TITLES = new Set([
  "rev", "rev.", "reverend", "deputy", "officer", "dr", "dr.", "mr", "mr.",
  "mrs", "mrs.", "ms", "ms.", "detective", "sheriff", "chief", "judge",
  "father", "pastor", "captain", "sergeant", "nurse", "clerk", "hostess",
]);

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function nameTokens(name) {
  const words = name
    .split(/\s+/)
    .filter((w) => !TITLES.has(w.toLowerCase()) && w.replace(/\W/g, "").length >= 3);
  const parts = words.flatMap((w) => (w.includes("-") ? [w, ...w.split("-")] : [w]));
  return [...new Set([name, ...parts])].filter((t) => t.length >= 3);
}

function addRules(c) {
  const victimWords = new Set(
    c.victim.name.toLowerCase().split(/\s+/).filter(Boolean)
  );

  // Tokens per suspect; drop tokens that are the victim's name or shared by 2+ suspects
  const tokenMap = {};
  const counts = {};
  for (const s of c.suspects) {
    tokenMap[s.id] = nameTokens(s.name).filter(
      (t) => !victimWords.has(t.toLowerCase()) || t.includes(" ")
    );
    for (const t of tokenMap[s.id]) {
      counts[t.toLowerCase()] = (counts[t.toLowerCase()] || 0) + 1;
    }
  }
  for (const s of c.suspects) {
    tokenMap[s.id] = tokenMap[s.id].filter((t) => counts[t.toLowerCase()] === 1);
  }

  // Things that can unlock someone: discoverable evidence + witnesses
  const sources = [
    ...c.evidence
      .filter((e) => e.discoverable !== false)
      .map((e) => ({ id: e.id, text: `${e.name} ${e.description || ""}` })),
    ...(c.witnesses || []).map((w) => ({
      id: w.id,
      text: `${w.name} ${w.role || ""} ${w.statement || ""}`,
    })),
  ];

  const hits = {};
  for (const s of c.suspects) {
    const regs = tokenMap[s.id].map((t) => new RegExp(`\\b${esc(t)}\\b`, "i"));
    hits[s.id] = sources
      .filter((src) => regs.some((r) => r.test(src.text)))
      .map((src) => src.id);
  }

  const killer = (c.solution.killer || "").trim().toLowerCase();
  const notes = [];

  for (const s of c.suspects) {
    // Respect rules the author already wrote
    if (s.starts_visible || (s.revealed_by && s.revealed_by.length)) {
      notes.push(`${s.id} ${s.name}: kept your existing rule`);
      continue;
    }
    const close = CLOSE.test(`${s.relationship_to_victim || ""} ${s.role || ""}`);
    if (close) {
      s.starts_visible = true;
      notes.push(`${s.id} ${s.name}: visible at start (close to victim)`);
    } else if (hits[s.id].length === 0) {
      s.starts_visible = true;
      notes.push(`${s.id} ${s.name}: visible at start (never named in evidence, so cannot be locked)`);
    } else {
      s.revealed_by = hits[s.id];
    }
  }

  // Make sure at least MIN_VISIBLE suspects are visible at the start
  let visibleCount = c.suspects.filter((s) => s.starts_visible).length;
  const candidates = c.suspects
    .filter((s) => !s.starts_visible)
    .sort((a, b) => {
      const ak = a.name.trim().toLowerCase() === killer ? 1 : 0;
      const bk = b.name.trim().toLowerCase() === killer ? 1 : 0;
      if (ak !== bk) return ak - bk; // non-killers first
      return (hits[b.id]?.length || 0) - (hits[a.id]?.length || 0);
    });
  while (visibleCount < MIN_VISIBLE && candidates.length) {
    const s = candidates.shift();
    s.starts_visible = true;
    delete s.revealed_by;
    visibleCount++;
    notes.push(`${s.id} ${s.name}: made visible at start (minimum ${MIN_VISIBLE} needed)`);
  }

  // Summary
  for (const s of c.suspects) {
    const isKiller = s.name.trim().toLowerCase() === killer ? " (KILLER)" : "";
    if (s.starts_visible) {
      console.log(`  ${s.id} ${s.name}${isKiller}: VISIBLE AT START`);
    } else {
      console.log(
        `  ${s.id} ${s.name}${isKiller}: unlocked by ${s.revealed_by.length} items -> ${s.revealed_by.join(", ")}`
      );
    }
  }
  if (notes.length) console.log("  Notes:\n   - " + notes.join("\n   - "));
  const k = c.suspects.find((s) => s.name.trim().toLowerCase() === killer);
  if (k && k.starts_visible) {
    console.log("  CHECK: the killer is visible from the start in this case.");
  }
  return c;
}

const files = fs
  .readdirSync(".")
  .filter((f) => f.toUpperCase().includes("MASTER") && f.endsWith(".json"));

if (files.length === 0) console.log("No MASTER json files found in this folder.");

for (const file of files) {
  const c = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`\n${c.case.id}  (${file})`);
  addRules(c);
  const outName = `reveal-${c.case.id}.json`;
  fs.writeFileSync(outName, JSON.stringify(c, null, 2));
  console.log(`  -> Created ${outName}`);
}