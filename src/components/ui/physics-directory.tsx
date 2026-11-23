"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { FullSearchTrigger, SearchTrigger } from "fumadocs-ui/layouts/shared/slots/search-trigger";
import { LanguageSelect } from "fumadocs-ui/layouts/shared/slots/language-select";
import { ThemeSwitch } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { ArrowUpRight, Languages } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import phaseDiagramCard from "@/lib/phase-diagram-card.json";
import potentialEmergenceCard from "@/lib/potential-emergence-card.json";

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
    imageAlt: "Measured IdeaSearchFitter three-dimensional potential landscape",
    susceptibilityTitle: "Information susceptibility in LLM agents",
    susceptibilityAbstract:
      "We treat a fixed LLM as a linear-response channel: world knowledge gives a head start, while hallucination limits the marginal return as the budget grows.",
    susceptibilityImageAlt: "Linear-response curves for information susceptibility in LLM agents",
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
    imageAlt: "真实 IdeaSearchFitter 三维势能 landscape",
    susceptibilityTitle: "LLM 智能体的信息响应率",
    susceptibilityAbstract:
      "把固定 LLM 看作线性响应通道：世界知识带来先发优势，而幻觉限制预算增加后的边际收益。",
    susceptibilityImageAlt: "LLM 智能体信息响应率的线性响应曲线",
  },
} as const;

function ProjectAbstract({
  id,
  children,
  expandLabel,
  collapseLabel,
}: {
  id: string;
  children: string;
  expandLabel: string;
  collapseLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="physics-card-abstract-wrap">
      <p id={id} className={"physics-card-abstract" + (open ? " is-expanded" : "")}>
        {children}
      </p>
      <button
        type="button"
        className="physics-card-abstract-toggle"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? collapseLabel : expandLabel}
      </button>
    </div>
  );
}

export function PhysicsDirectory({
  lang,
}: {
  lang: string;
}) {
  const locale = lang === "cn" ? "cn" : "en";
  const text = copy[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1600, height: 1000 });
  const detailHref =
    locale === "cn" ? "/detailed-balance?lang=zh" : "/detailed-balance";
  const susceptibilityHref = "/susceptibility";
  const phaseText = phaseDiagramCard[locale === "cn" ? "zh" : "en"];
  const potentialText = potentialEmergenceCard[locale === "cn" ? "zh" : "en"];
  const projects = [
    {
      id: "detailed-balance",
      title: text.title,
      abstract: text.abstract,
      image: "/detailed-balance/assets/figs/ideasearchfitter-landscape-3d-square.png",
      imageAlt: text.imageAlt,
      article: "https://link.aps.org/doi/10.1103/kwx6-clqd",
      href: detailHref,
    },
    {
      id: potentialEmergenceCard.slug,
      title: potentialText.title,
      abstract: potentialText.abstract,
      image: potentialEmergenceCard.image,
      imageAlt: potentialText.alt,
      article: potentialEmergenceCard.article,
      href: `${potentialEmergenceCard.href}?lang=${locale === "cn" ? "zh" : "en"}`,
    },
    {
      id: phaseDiagramCard.slug,
      title: phaseText.title,
      abstract: phaseText.abstract,
      image: phaseDiagramCard.image,
      imageAlt: phaseText.alt,
      article: phaseDiagramCard.article,
      href: phaseDiagramCard.href,
    },
    {
      id: "susceptibility",
      title: text.susceptibilityTitle,
      abstract: text.susceptibilityAbstract,
      image: "/susceptibility/assets/hero-square.png",
      imageAlt: text.susceptibilityImageAlt,
      article: "https://arxiv.org/abs/2603.23626",
      href: susceptibilityHref,
    },
  ];

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

      <header className="physics-topbar">
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

      <div className="physics-directory-content relative z-10 mx-auto w-full max-w-6xl">
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
          {projects.map((project) => (
            <article key={project.id} id={`${project.id}-card`} className="physics-project-card w-full max-w-[26rem] justify-self-start overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/65 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-transparent">
              <a
                href={project.href}
                className={`group relative block aspect-square focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/60 focus-visible:ring-offset-2${project.id === "detailed-balance" ? " bg-slate-100 dark:bg-slate-900" : ""}`}
                aria-label={text.enter}
              >
                <img
                  src={project.image}
                  alt={project.imageAlt}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.015]"
                />
              </a>
              <div className="physics-project-card-body flex flex-col p-6 sm:p-7">
                <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                  {project.title}
                </h2>
                <ProjectAbstract
                  id={`${project.id}-abstract`}
                  expandLabel={text.expandAbstract}
                  collapseLabel={text.collapseAbstract}
                >
                  {project.abstract}
                </ProjectAbstract>
                <div className="mt-auto flex flex-nowrap gap-2 pt-6">
                  <a
                    href={project.article}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full bg-foreground px-3 py-3 text-[11px] font-semibold text-background transition hover:-translate-y-0.5 sm:px-5 sm:text-xs"
                  >
                    {text.article}
                    <ArrowUpRight className="ml-1 size-3.5 shrink-0" aria-hidden="true" />
                  </a>
                  <a
                    href={project.href}
                    className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center whitespace-nowrap rounded-full border border-foreground/20 bg-white/35 px-3 py-3 text-[11px] font-semibold transition hover:-translate-y-0.5 hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/20 sm:px-5 sm:text-xs"
                  >
                    {text.enter}
                    <ArrowUpRight className="ml-1 size-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
