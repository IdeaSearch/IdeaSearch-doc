import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { i18n } from "@/lib/i18n";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: (
        <>
          <Image
            src="/logo.png"
            alt="IdeaSearch Logo"
            width={24}
            height={24}
          />
          IdeaSearch
        </>
      ),
      url: locale === "cn" ? "/cn" : "/en",
    },
    // see https://fumadocs.dev/docs/ui/navigation/links
    links: [],
    githubUrl: "https://github.com/IdeaSearch/IdeaSearch-doc",
  };
}
