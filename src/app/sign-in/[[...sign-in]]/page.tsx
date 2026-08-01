import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-full border border-brass/60 flex items-center justify-center">
          <span className="text-brass font-display text-sm">DB</span>
        </div>
        <span className="font-display uppercase text-lg tracking-wide leading-none text-parchment">
          Detective
          <span className="block -mt-1 text-xs tracking-[0.3em] text-fog">
            Bureau
          </span>
        </span>
      </Link>
      <SignIn appearance={clerkAppearance} />
    </div>
  );
}