import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { i18n } from "@/lib/i18n";

const i18nMiddleware = createI18nMiddleware(i18n);

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  const url = new URL(request.url);
  const hostname = request.headers.get("host")?.split(":")[0];

  // The Physics of AI domain has one canonical directory route per locale.
  // Handle these aliases before the generic locale middleware adds its own
  // trailing-slash/default-language redirect, so the root never looks like a
  // missing page to visitors.
  if (hostname === "physics.ideasearch.cn") {
    const locale = url.pathname.startsWith("/cn") ? "cn" : "en";
    if (url.pathname === "/" || url.pathname === "/en" || url.pathname === "/en/" || url.pathname === "/cn" || url.pathname === "/cn/") {
      url.pathname = `/${locale}/physics`;
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
    "/((?!api|og|llms\\.txt|llms-full\\.txt|llms\\.mdx|detailed-balance(?:/|$)|_next/static|_next/image|favicon.ico|logo.png).*)",
  ],
};
