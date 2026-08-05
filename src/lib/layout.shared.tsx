import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import Image from "next/image";
import { repoUrl } from "@/lib/repo";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export function baseOptions(locale: string): BaseLayoutProps {
  return {
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
    githubUrl: repoUrl,
  };
}
