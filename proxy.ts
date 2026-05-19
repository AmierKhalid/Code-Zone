import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-up(.*)",
  "/sign-in(.*)",
  "/sso-callback(.*)",
  "/api/ai(.*)",
  "/api/code(.*)",
]);

const isAuthPageRoute = createRouteMatcher([
  "/sign-up(.*)",
  "/sign-in(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();

    // Redirect signed-in users away from auth *pages* only (not public APIs)
    if (
      userId &&
      isAuthPageRoute(req) &&
      !req.nextUrl.pathname.startsWith("/sso-callback")
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Redirect unauthenticated users from protected routes
    if (!userId && !isPublicRoute(req)) {
      const isApiRoute =
        req.nextUrl.pathname.startsWith("/api") ||
        req.nextUrl.pathname.startsWith("/trpc");

      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("Middleware Error: ", err);
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
