"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { FullSearchTrigger, SearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { LanguageSelect } from "fumadocs-ui/layouts/shared/slots/language-select";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { ArrowUpRight, Languages } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const copy = {
  en: {
    subtitle: "The physical principles of intelligence.",
    title: "Detailed balance in large language model-driven agents",
    abstract:
      "We ask whether state-to-state transitions in LLM-driven agents admit an effective potential. Coarse-graining many token trajectories into semantic states lets us test measured forward–reverse probability ratios against a potential landscape across tasks and model snapshots.",
    moreLabel: "MORE",
    moreTitle: "More research",
    moreDescription: "More projects coming soon.",
    moreArticle: "Coming soon",
    expandAbstract: "Expand abstract",
    collapseAbstract: "Collapse abstract",
    article: "Read the article",
    enter: "Enter the website",
    imageAlt: "Detailed balance unit transition channel",
  },
  cn: {
    subtitle: "智能的物理原理。",
    title: "大语言模型驱动智能体中的细致平衡",
    abstract:
      "我们考察 LLM 驱动智能体的状态转移是否能够由一个有效势描述。将许多 token 轨迹粗粒化为语义状态后，可以在不同任务和模型快照上，用实测的正逆转移概率比检验势能景观。",
    moreLabel: "更多",
    moreTitle: "更多研究",
    moreDescription: "更多项目，敬请期待。",
    moreArticle: "敬请期待",
    expandAbstract: "展开摘要",
    collapseAbstract: "收起摘要",
    article: "阅读文章",
    enter: "进入网页",
    imageAlt: "细致平衡单元转移通道",
  },
} as const;

export function PhysicsDirectory({
  lang,
}: {
  lang: string;
}) {
  const locale = lang === "cn" ? "cn" : "en";
  const text = copy[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [abstractOpen, setAbstractOpen] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1600, height: 1000 });
  const detailHref =
    locale === "cn" ? "/detailed-balance?lang=zh" : "/detailed-balance";

  useEffect(() => {
    setMounted(true);
    const resize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const colors =
    resolvedTheme === "dark"
      ? ["#172554", "#312e81", "#164e63", "#14532d", "#713f12"]
      : ["#dff4ff", "#ece5ff", "#e2fbf2", "#fff7d8", "#e5efff"];

  return (
    <main className="physics-directory relative min-h-screen overflow-hidden bg-background px-5 pb-8 text-foreground sm:px-8">
      <div className="physics-directory-background pointer-events-none fixed inset-0 z-0 opacity-80" aria-hidden="true">
        {mounted && (
          <MeshGradient
            width={dimensions.width}
            height={dimensions.height}
            colors={colors}
            distortion={0.78}
            swirl={0.5}
            speed={0.25}
            grainMixer={0}
            grainOverlay={0}
          />
        )}
        <div className="absolute inset-0 bg-white/45 dark:bg-black/40" />
      </div>

      <header className="physics-topbar" role="banner">
        <div className="physics-topbar-inner">
          <Link href={locale === "cn" ? "/cn" : "/en"} className="physics-topbar-brand">
            <span className="physics-topbar-mark" aria-hidden="true">
              <img src="/favicon.svg" alt="" />
            </span>
            <span className="physics-topbar-brand-text">physics of AI</span>
          </Link>
          <div className="physics-topbar-actions">
            <FullSearchTrigger className="physics-topbar-search" />
            <SearchTrigger className="physics-topbar-search-icon" aria-label="Search" />
            <ThemeSwitch className="physics-topbar-theme" mode="light-dark" />
            <LanguageSelect className="physics-topbar-language">
              <Languages className="size-4" aria-hidden="true" />
            </LanguageSelect>
          </div>
        </div>
      </header>

      <div className="physics-directory-content relative z-10 w-full max-w-6xl">
        <h1 className="physics-wordmark mb-12">
          <span className="physics-wordmark-mark" aria-hidden="true">
            <img src="/favicon.svg" alt="" />
          </span>
          <span className="physics-wordmark-type">
            <span className="physics-wordmark-main">PHYSICS OF AI</span>
            <span className="physics-wordmark-subtitle">{text.subtitle}</span>
          </span>
        </h1>

        <div className="physics-card-grid">
          <article className="physics-project-card w-full max-w-[26rem] justify-self-start overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/65 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <Link
              href={detailHref}
              className="group relative block aspect-square bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2 dark:bg-slate-900"
              aria-label={text.enter}
            >
              <img
                src="/detailed-balance/assets/figs/unit-sketch-square.png"
                alt={text.imageAlt}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
              />
            </Link>
            <div className="physics-project-card-body flex flex-col p-6 sm:p-7">
              <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                {text.title}
              </h2>
              <div className="physics-card-abstract-wrap">
                <p className={`physics-card-abstract${abstractOpen ? " is-expanded" : ""}`}>
                  {text.abstract}
                </p>
                <button
                  type="button"
                  className="physics-card-abstract-toggle"
                  aria-expanded={abstractOpen}
                  onClick={() => setAbstractOpen((open) => !open)}
                >
                  {abstractOpen ? text.collapseAbstract : text.expandAbstract}
                </button>
              </div>
              <div className="mt-auto flex flex-nowrap gap-2 pt-6">
                <a
                  href="https://arxiv.org/abs/2512.10047"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-foreground px-3 py-3 text-[11px] font-semibold text-background transition hover:-translate-y-0.5 sm:px-5 sm:text-xs"
                >
                  {text.article}
                  <ArrowUpRight className="ml-1 size-3.5 shrink-0" aria-hidden="true" />
                </a>
                <Link
                  href={detailHref}
                  className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full border border-foreground/20 bg-white/35 px-3 py-3 text-[11px] font-semibold transition hover:-translate-y-0.5 hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/20 sm:px-5 sm:text-xs"
                >
                  {text.enter}
                  <ArrowUpRight className="ml-1 size-3.5 shrink-0" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
          <article className="physics-project-card w-full max-w-[26rem] justify-self-start overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/65 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10" aria-label={text.moreTitle}>
            <div className="physics-more-image relative flex aspect-square items-center justify-center bg-slate-100 dark:bg-slate-900">
              <img src="/favicon.svg" alt="" className="h-1/2 w-1/2 object-contain opacity-75" />
              <span className="physics-more-card-label absolute left-5 top-5">{text.moreLabel}</span>
            </div>
            <div className="physics-project-card-body flex flex-col p-6 sm:p-7">
              <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">{text.moreTitle}</h2>
              <p className="physics-card-abstract mt-4">{text.moreDescription}</p>
              <div className="mt-auto flex flex-nowrap gap-2 pt-6">
                <button type="button" disabled className="physics-placeholder-button inline-flex min-h-11 w-full min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-foreground px-3 py-3 text-[11px] font-semibold text-background sm:px-5 sm:text-xs">
                  {text.moreArticle}
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
