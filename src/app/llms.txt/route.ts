import { llms } from "fumadocs-core/source/llms";
import { i18n } from "@/lib/i18n";
import { source } from "@/lib/source";

export const revalidate = false;

const languageNames: Record<string, string> = {
  en: "English",
  cn: "简体中文",
};

/**
 * The llms.txt index: one H1, a summary, then one section per language.
 *
 * `llms(source).index()` would emit a separate H1 per language, so the tree is
 * walked node by node with `indexNode` instead.
 */
export async function GET() {
  const { indexNode } = llms(source);

  const out = [
    "# IdeaSearch",
    "",
    "> Documentation for the IdeaSearch framework and IdeaSearch Fitter.",
    "",
  ];

  for (const lang of i18n.languages) {
    out.push(`## ${languageNames[lang] ?? lang}`, "");
    for (const node of source.getPageTree(lang).children) {
      out.push(indexNode(node, lang));
    }
    out.push("");
  }

  out.push(
    "## Optional",
    "",
    "- [Full documentation](/llms-full.txt): every page concatenated as Markdown",
  );

  return new Response(out.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
