import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { ReactNode } from 'react';
import { baseOptions } from "@/lib/layout.shared";


export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: ReactNode;
}) {
  const { lang } = await params;
  return <HomeLayout 
    {...baseOptions(lang)}
    links={lang === "cn" ? [
      {
        text: "文档",
        url: "/cn/docs/framework",
      },
      {
        text: "博客",
        url: "/cn/blog",
      },
    ] : [
      {
        text: "Documentation",
        url: "/en/docs/framework",
      },
      {
        text: "Blog",
        url: "/en/blog",
      },
    ]}
  >{children}</HomeLayout>;
}
