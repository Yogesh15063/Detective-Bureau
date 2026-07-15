import { loadPlayerCase } from "@/lib/cases/loadCase";

loadPlayerCase("CASE-GH-1979R-2025").then((playerCase) => {
  console.log("Loaded OK. Keys:", Object.keys(playerCase));
  console.log("Has solution?", "solution" in playerCase);
});