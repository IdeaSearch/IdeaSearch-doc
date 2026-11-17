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

## Research Pages

`public/detailed-balance/` and `public/susceptibility/` serve the two research
pages at `/detailed-balance` and `/susceptibility` on `physics.ideasearch.cn`.
The 2026-11-15 delivery adds local KaTeX assets and the Detailed Balance content
revision. The susceptibility page retains the newer PRBench response landscape,
PHYBench curves, experiment data, and published-paper links.

Edit formulas and page content in each site's `index.src.html`. Run
`bun run build:papers` to regenerate `index.html`; `bun run build` also runs this
step automatically. The math renderers use the bundled KaTeX without a network
request. The Detailed Balance renderer also refreshes `MANIFEST.sha256`.

`public/phase-diagram/` contains the unmodified v12.2 static delivery for
[A phase diagram for training and inference in language models](https://arxiv.org/abs/2611.19848).
It is published at `https://physics.ideasearch.cn/phase-diagram`; the entry redirects
to `/phase-diagram/`, which serves `index.html` so relative asset and download URLs work. This package needs
no build or dependencies. Replace the complete directory with a verified future
delivery rather than editing its files or running its data generators.

The Physics homepage includes all three projects in English and Chinese. The
phase-diagram card reads the delivered `card.json` from `src/lib/phase-diagram-card.json`.
Its cover is the unchanged `public/phase-diagram/assets/hero-square.png` from the package.

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
