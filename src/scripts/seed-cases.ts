/**
 * Run with: npx tsx src/scripts/seed-cases.ts
 *
 * Reads every .json file in cases-data/master/ and upserts it into
 * MongoDB. This is how new cases get added to the DB — no code
 * changes needed, per the project rule.
 */
import { connectDB } from "@/lib/db/connect";
import { Case } from "@/models/Case";
import type { MasterCase } from "@/types/case";
import fs from "fs/promises";
import path from "path";

async function seed() {
  await connectDB();

  const masterDir = path.join(process.cwd(), "cases-data", "master");
  const files = (await fs.readdir(masterDir)).filter((f) =>
    f.endsWith(".json")
  );

  console.log(`Found ${files.length} case file(s) to seed.`);

  for (const file of files) {
    const raw = await fs.readFile(path.join(masterDir, file), "utf-8");
    const master: MasterCase = JSON.parse(raw);

    await Case.findOneAndUpdate(
      { caseId: master.case.id },
      {
        caseId: master.case.id,
        title: master.case.title,
        town: master.case.town,
        targetEvidenceCount: master.case.target_evidence_count,
        coverImage: master.case.cover_image ?? null,
        masterData: master,
        isPublished: true,
        isPremium: false,
      },
      { upsert: true, new: true }
    );

    console.log(`Seeded: ${master.case.id} - ${master.case.title}`);
  }

  console.log("Done.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});