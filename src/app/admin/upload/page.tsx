"use client";

import { useState } from "react";

export default function AdminUploadPage() {
  const [adminKey, setAdminKey] = useState("");
  const [caseFile, setCaseFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!caseFile) {
      setError("Select a case JSON file first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("adminKey", adminKey);
    formData.append("caseJson", caseFile);
    if (imageFile) formData.append("coverImage", imageFile);
    formData.append("isPublished", String(isPublished));
    formData.append("isPremium", String(isPremium));

    try {
      const res = await fetch("/api/admin/cases", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
      } else {
        setResult(`Saved: ${data.caseId} — ${data.title}`);
      }
    } catch {
      setError("Upload failed — network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink text-parchment px-6 py-16">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display uppercase text-3xl mb-8">Admin: Upload Case</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-mono text-xs text-fog mb-1.5">
              Admin Key
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              className="w-full bg-charcoal border border-white/10 rounded px-3 py-2 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-fog mb-1.5">
              Case JSON (master.json)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => setCaseFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-fog mb-1.5">
              Cover Image (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="accent-brass"
              />
              Published (visible to players)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPremium}
                onChange={(e) => setIsPremium(e.target.checked)}
                className="accent-brass"
              />
              Premium
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-brass text-parchment font-medium px-6 py-2.5 rounded hover:bg-brass-dim disabled:opacity-50"
          >
            {submitting ? "Uploading…" : "Upload Case"}
          </button>

          {result && (
            <p className="font-mono text-sm text-brass">{result}</p>
          )}
          {error && <p className="font-mono text-sm text-rust">{error}</p>}
        </form>
      </div>
    </div>
  );
}