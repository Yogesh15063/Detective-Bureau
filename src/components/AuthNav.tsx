"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

/**
 * Drop this into any header. Renders NOTHING when signed out (the
 * page's main CTA already handles that flow) — only shows a
 * "Leave the Bureau" sign-out link once the user is actually logged
 * in. Avoids duplicating the main CTA's text/link.
 */
export default function AuthNav() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <button
      onClick={() => signOut().then(() => router.push("/"))}
      className="text-fog hover:text-parchment text-sm tracking-wide"
    >
      Leave the Bureau
    </button>
  );
}