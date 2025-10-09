/** biome-ignore-all lint/suspicious/noExplicitAny: 666 */
import { getGithubLastEdit } from 'fumadocs-core/content/github';
import { createRelativeLink } from "fumadocs-ui/mdx";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPageImage, source } from "@/lib/source";
import { getMDXComponents } from "@/mdx-components";


export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}) {
  const { slug, lang } = await params;

  const page = source.getPage(slug, lang);
  if (!page) notFound();

  const time = await getGithubLastEdit({
    owner: 'IdeaSearch',
    repo: 'IdeaSearch-doc',
    path: `content/docs/${page.path}`,
  });

  const MDX = page.data.body;

  return (
    <DocsPage 
      toc={page.data.toc} 
      full={page.data.full}
      lastUpdate={time ? new Date(time) : undefined}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source as any, page as any),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug?: string[] }>;
}): Promise<Metadata> {
  const { slug, lang } = await params;

  const page = source.getPage(slug, lang);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
}
