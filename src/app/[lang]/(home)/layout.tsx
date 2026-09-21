import { HomeLayout } from "fumadocs-ui/layouts/home";
import { headers } from "next/headers";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { baseOptions } from "@/lib/layout.shared";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = (await params).lang;
  const host = (await headers()).get("host") ?? "";
  if (host.split(":")[0] !== "physics.ideasearch.cn") return {};

  const isChinese = lang === "cn";
  const title = isChinese ? "PHYSICS OF AI · 细致平衡" : "PHYSICS OF AI · Detailed Balance";
  const description = isChinese
    ? "Physics of AI：从 token 微观轨迹到智能体状态转移的细致平衡。"
    : "Physics of AI: detailed balance from token trajectories to state transitions in agents.";

  return {
    metadataBase: new URL("https://physics.ideasearch.cn"),
    title,
    description,
    alternates: { canonical: `/${lang}` },
    openGraph: { title, description, url: `/${lang}`, type: "website" },
  };
}

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
