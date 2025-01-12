import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/"]);
const isUploadRoute = createRouteMatcher([
  "/api/uploadthing(.*)",
  "/api/library(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isUploadRoute(request)) {
    return NextResponse.next();
  }

  const { userId, redirectToSignIn } = await auth();

  if (!userId && !isPublicRoute(request)) {
    return redirectToSignIn();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals, static files, and webhook routes
    "/((?!_next|api/chat|api/graph|api/webhook/|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
