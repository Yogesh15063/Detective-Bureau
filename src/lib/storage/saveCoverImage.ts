import fs from "fs/promises";
import path from "path";

/**
 * The ONE function to swap when moving to real cloud storage
 * (Vercel Blob, S3, Cloudinary, etc). Right now it just writes to
 * public/case-covers/ on disk, which works fine for local dev but
 * won't persist on most serverless hosts. Everything else in the app
 * only ever deals with the returned URL string — nothing else needs
 * to change when this function's internals change.
 */
export async function saveCoverImage(
  caseId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${caseId}.${ext}`;

  const dir = path.join(process.cwd(), "public", "case-covers");
  await fs.mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);

  return `/case-covers/${filename}`;
}