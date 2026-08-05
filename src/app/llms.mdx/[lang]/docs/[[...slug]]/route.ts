import { notFound } from "next/navigation";
import { getLLMText, source } from "@/lib/source";

export const revalidate = false;

/**
 * Serves the processed Markdown of a docs page, so the page actions can offer
 * "copy as Markdown" and "open in an LLM".
 */
export async function GET(
  _req: Request,
  { params }: RouteContext<"/llms.mdx/[lang]/docs/[[...slug]]">,
) {
  const { lang, slug } = await params;

  const page = source.getPage(slug, lang);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
