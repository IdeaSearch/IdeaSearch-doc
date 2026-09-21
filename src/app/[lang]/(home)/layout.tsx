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
  const title = "PHYSICS OF AI";
  const description = isChinese
    ? "面向 AI 系统与智能体的物理学研究目录。"
    : "A directory of research on physical principles for AI systems and agents.";

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
