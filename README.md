# IdeaSearch Documentation

This repository contains the Next.js/Fumadocs source for [ideasearch.cn](https://www.ideasearch.cn/), the bilingual documentation site for the [IdeaSearch framework](https://github.com/IdeaSearch/IdeaSearch-framework) and [IdeaSearch-fit](https://github.com/IdeaSearch/IdeaSearch-fit).

## Documentation Scope

- `content/docs/framework/` documents the `IdeaSearcher` generation–evaluation loop, configuration, persistence, and multi-island execution.
- `content/docs/fitter/` documents symbolic-regression setup, formula evaluation, and result retrieval through `IdeaSearchFitter`.
- English pages use `.mdx`; Simplified Chinese pages use `.cn.mdx`.

IdeaSearch is documented as a configurable platform for iterative-agent experiments and practical search. Generated Ideas and formulas are evaluated candidates, not independently validated scientific findings. Technical pages should state the relevant inputs, controls, recorded artifacts, and validation boundary.

For one-off tasks already handled by a general-purpose model or agent, a direct call may be simpler than running the framework.

## Repository Structure

| Path | Purpose |
| --- | --- |
| `content/docs/framework/` | English and Chinese IdeaSearch framework documentation |
| `content/docs/fitter/` | English and Chinese IdeaSearch-fit documentation and demo |
| `content/blog/` | Project posts |
| `src/app/[lang]/` | Localized Next.js routes and layouts |
| `src/components/ui/hero-section.tsx` | Homepage hero content and calls to action |
| `src/lib/` | Internationalization, content loading, and shared layout configuration |
| `public/` | Static assets |

The site is built with Next.js and Fumadocs.

## Editing Documentation

1. Edit the English and Chinese page pair under `content/docs/`.
2. Update the corresponding `meta.json` and `meta.cn.json` files when navigation changes.
3. Keep API names, defaults, examples, limitations, and links consistent with the source repositories.
4. Preview both `/en/` and `/cn/` routes before submitting the change.

Homepage text is defined separately in `src/components/ui/hero-section.tsx`. Avoid duplicating time-sensitive positioning statements across the homepage and several MDX pages.

## Local Development

Install dependencies and start the development server:

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). The proxy (`src/proxy.ts`) redirects to the appropriate language route.

The equivalent npm workflow is:

```bash
npm install
npm run dev
```

## Checks

Before submitting documentation changes, run:

```bash
bun run lint
bun run build
```

The production build uses `next/font` to retrieve Inter and therefore requires network access to the Google Fonts endpoints. For bilingual pages, verify that facts, qualifiers, API names, links, and examples agree across the `.mdx` and `.cn.mdx` files.
