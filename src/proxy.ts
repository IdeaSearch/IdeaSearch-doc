import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { i18n } from "@/lib/i18n";
import { isPhysicsHost } from "@/lib/physics-host";

const i18nMiddleware = createI18nMiddleware(i18n);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const url = new URL(request.url);
  const hostname = request.headers.get("host")?.split(":")[0];

  // The physics of AI domain uses the same locale paths as the main site. The
  // root therefore has one explicit default-language destination, while
  // `/en` and `/cn` remain the two public directory entries.
  if (isPhysicsHost(hostname ?? "")) {
    if (url.pathname === "/") {
      url.pathname = "/en";
      return NextResponse.redirect(url);
    }
  }

  return i18nMiddleware(request, event);
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  // You may need to adjust it to ignore static assets in `/public` folder
  //
  // `og`, `llms.txt`, `llms-full.txt` and `llms.mdx` don't take a locale prefix
  // (`llms.mdx` carries the locale further down its own path), so without
  // excluding them the locale redirect sends them to `/<lang>/...`, which 404s.
  matcher: [
    "/((?!api|og|llms\\.txt|llms-full\\.txt|llms\\.mdx|detailed-balance(?:/|$)|_next/static|_next/image|favicon.ico|favicon.svg|logo.png).*)",
  ],
};
