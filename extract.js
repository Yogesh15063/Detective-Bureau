const fs = require("fs");

const files = fs
  .readdirSync(".")
  .filter((f) => f.toUpperCase().includes("MASTER") && f.endsWith(".json"));

if (files.length === 0) {
  console.log("No MASTER json files found in this folder.");
}

for (const file of files) {
  const c = JSON.parse(fs.readFileSync(file, "utf8"));

  const out = {
    source_file: file,
    case_id: c.case.id,
    suspects: c.suspects.map((s) => ({ id: s.id, name: s.name, role: s.role })),
    witnesses: (c.witnesses || []).map((w) => ({
      id: w.id,
      name: w.name,
      role: w.role,
    })),
    evidence: c.evidence.map((e) => ({
      id: e.id,
      name: e.name,
      location: e.location,
      importance: e.importance,
    })),
    killer: c.solution.killer,
    key_proof_chain: c.solution.key_proof_chain,
  };

  const outName = `extract-${c.case.id}.json`;
  fs.writeFileSync(outName, JSON.stringify(out, null, 1));
  console.log("Created", outName);
}