import { put } from "@vercel/blob";

/**
 * The ONE function to swap when moving storage providers. Uses Vercel
 * Blob — a natural fit since the app deploys to Vercel, and unlike
 * writing to public/ on disk, this actually works in a serverless
 * environment (Vercel's functions run on a read-only filesystem
 * except an ephemeral /tmp that doesn't persist between requests).
 *
 * Requires a BLOB_READ_WRITE_TOKEN in your environment — Vercel
 * creates this automatically once you enable Blob storage for your
 * project (Vercel dashboard → Storage → Create Database → Blob).
 * Vercel injects the token automatically for deployed environments;
 * for local dev, pull it with `vercel env pull .env.local`.
 */
export async function saveCoverImage(
  caseId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const filename = `case-covers/${caseId}.${ext}`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false, // overwrite on re-upload rather than accumulate
  });

  return blob.url;
}