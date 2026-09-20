import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import { i18n } from "@/lib/i18n";

export default createI18nMiddleware(i18n);

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
