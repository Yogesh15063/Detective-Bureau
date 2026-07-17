import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Public routes: landing page, sign-in/sign-up, and case browsing
// (list + detail) — no account needed just to look around. Actually
// investigating or accusing still requires being signed in, since
// those write to a specific user's Investigation doc.
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/cases",
  "/api/cases/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};