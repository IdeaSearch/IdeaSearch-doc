import { HomeLayout } from "fumadocs-ui/layouts/home";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;
  const host = (await headers()).get("host") ?? "";
  const physicsHost = host.split(":")[0] === "physics.ideasearch.cn";
  if (physicsHost) return children;

  return (
    <HomeLayout
      {...baseOptions(lang)}
      links={
        lang === "cn"
          ? [
              {
                text: "文档",
                url: "/cn/docs/framework",
              },
              {
                text: "博客",
                url: "/cn/blog",
              },
            ]
          : [
              {
                text: "Documentation",
                url: "/en/docs/framework",
              },
              {
                text: "Blog",
                url: "/en/blog",
              },
            ]
      }
    >
      {children}
    </HomeLayout>
  );
}
