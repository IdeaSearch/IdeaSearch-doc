"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const copy = {
  en: {
    eyebrow: "PHYSICS / IDEASEARCH",
    title: "A field guide to\nphysics in AI systems.",
    lead: "Experiments and concepts for reading generation as a dynamical system — from microscopic token paths to macroscopic response.",
    explore: "Explore the research",
    live: "LIVE / INTERACTIVE",
    detailTitle: "Detailed balance",
    detailText:
      "How semantic states, transition channels, and potential landscapes organize the behavior of an LLM agent.",
    enter: "Enter the study",
    chapters: [
      "Motivation",
      "Theory",
      "Experiments",
      "Applications",
      "Discussion",
    ],
    note: "A visual introduction built from measured IdeaSearchFitter and multi-task language-model data.",
    tools: "Related IdeaSearch tools",
    fitter: "IdeaSearch Fitter",
    fitterText: "Symbolic regression as a laboratory for agent search.",
    framework: "IdeaSearch Framework",
    frameworkText: "The generation–evaluation loop behind the experiments.",
    docs: "Open documentation",
    language: "中文",
    footer: "IdeaSearch · Physics notebook",
  },
  cn: {
    eyebrow: "PHYSICS / IDEASEARCH",
    title: "一份关于\nAI 系统中物理的图谱。",
    lead: "从 token 的微观轨迹到宏观响应率，记录把生成过程理解为动力系统的实验与概念。",
    explore: "探索研究内容",
    live: "LIVE / 交互研究",
    detailTitle: "细致平衡",
    detailText: "语义状态、转移通道与势能景观如何共同组织 LLM agent 的行为。",
    enter: "进入研究页面",
    chapters: ["动机", "理论", "实验", "应用", "讨论"],
    note: "页面中的图形来自实测的 IdeaSearchFitter 与多任务语言模型数据。",
    tools: "相关 IdeaSearch 工具",
    fitter: "IdeaSearch Fitter",
    fitterText: "把符号回归作为研究 agent 搜索的实验室。",
    framework: "IdeaSearch Framework",
    frameworkText: "实验背后的生成—评价循环。",
    docs: "打开文档",
    language: "English",
    footer: "IdeaSearch · Physics notebook",
  },
} as const;

export function PhysicsDirectory({
  lang,
  preview = false,
}: {
  lang: string;
  preview?: boolean;
}) {
  const locale = lang === "cn" ? "cn" : "en";
  const text = copy[locale];
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 1600, height: 1000 });
  const nextLocale = locale === "cn" ? "en" : "cn";
  const routeBase = preview ? `/${nextLocale}/physics` : `/${nextLocale}`;
  const languageHref = routeBase;

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
    <main className="physics-directory min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-0 opacity-80">
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

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-14">
        <Link
          href={
            preview ? `/${locale}/physics` : locale === "cn" ? "/cn" : "/en"
          }
          className="flex items-center gap-3 text-sm font-semibold tracking-tight"
        >
          <Image
            src="/logo.png"
            alt="IdeaSearch"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <span>
            IdeaSearch{" "}
            <span className="font-normal text-foreground/50">/ Physics</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link
            href={languageHref}
            className="rounded-full border border-foreground/15 bg-white/35 px-4 py-2 backdrop-blur transition hover:bg-white/65 dark:bg-white/10 dark:hover:bg-white/20"
          >
            {text.language}
          </Link>
          <Link
            href={locale === "cn" ? "/cn/docs/framework" : "/en/docs/framework"}
            className="hidden rounded-full px-4 py-2 text-foreground/65 transition hover:bg-white/40 hover:text-foreground sm:inline-flex"
          >
            {text.docs}
          </Link>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-6 pb-20 pt-12 sm:px-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-14 lg:pb-28 lg:pt-20">
        <div className="max-w-2xl">
          <p className="mb-6 text-xs font-semibold tracking-[0.24em] text-blue-700 dark:text-cyan-300">
            {text.eyebrow}
          </p>
          <h1 className="whitespace-pre-line text-balance text-5xl font-semibold leading-[1.03] tracking-[-0.055em] sm:text-6xl lg:text-8xl">
            {text.title}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-foreground/65 sm:text-xl">
            {text.lead}
          </p>
          <a
            href="#research"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-xl shadow-blue-900/10 transition hover:-translate-y-0.5 hover:shadow-2xl"
          >
            {text.explore} <span aria-hidden="true">↓</span>
          </a>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:justify-self-end">
          <div className="absolute -inset-10 rounded-full bg-cyan-300/20 blur-3xl dark:bg-indigo-500/20" />
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <div className="relative aspect-square overflow-hidden rounded-[1.45rem] bg-slate-100 dark:bg-slate-900">
              <Image
                src="/detailed-balance/assets/figs/unit-sketch-square.png"
                alt="A unit transition channel"
                fill
                sizes="(max-width: 1024px) 90vw, 500px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/50 bg-white/75 px-4 py-3 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-blue-700 dark:text-cyan-300">
                  {text.live}
                </p>
                <p className="mt-1 text-sm font-medium">{text.detailTitle}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="research"
        className="relative z-10 mx-auto w-full max-w-7xl scroll-mt-10 px-6 pb-24 sm:px-10 lg:px-14"
      >
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-foreground/45">
              01 / RESEARCH ENTRY
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {text.explore}
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm leading-6 text-foreground/55 md:block">
            {text.note}
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <Link
            href="/detailed-balance"
            className="group rounded-[1.75rem] border border-white/75 bg-white/68 p-7 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/85 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 sm:p-9"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-blue-700 dark:text-cyan-300">
                  {text.live}
                </p>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {text.detailTitle}
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-foreground/62">
                  {text.detailText}
                </p>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-full border border-foreground/15 text-xl transition group-hover:translate-x-1">
                ↗
              </span>
            </div>
            <div className="mt-9 grid grid-cols-2 gap-2 border-t border-foreground/10 pt-5 sm:grid-cols-5">
              {text.chapters.map((chapter, index) => (
                <span key={chapter} className="text-sm text-foreground/58">
                  <b className="mr-2 font-mono text-[10px] text-foreground/35">
                    0{index + 1}
                  </b>
                  {chapter}
                </span>
              ))}
            </div>
            <p className="mt-7 text-sm font-semibold">
              {text.enter}{" "}
              <span className="ml-2 transition group-hover:ml-3">→</span>
            </p>
          </Link>

          <div className="rounded-[1.75rem] border border-white/75 bg-slate-950/90 p-7 text-white shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.18em] text-cyan-300">
              02 / {text.tools}
            </p>
            <div className="mt-8 space-y-7">
              <Link
                href={locale === "cn" ? "/cn/docs/fitter" : "/en/docs/fitter"}
                className="group block border-b border-white/15 pb-6"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-medium">{text.fitter}</h3>
                  <span className="text-white/50 transition group-hover:translate-x-1">
                    ↗
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {text.fitterText}
                </p>
              </Link>
              <Link
                href={
                  locale === "cn" ? "/cn/docs/framework" : "/en/docs/framework"
                }
                className="group block"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-medium">{text.framework}</h3>
                  <span className="text-white/50 transition group-hover:translate-x-1">
                    ↗
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  {text.frameworkText}
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-foreground/10 px-6 py-8 text-xs text-foreground/45 sm:px-10 lg:px-14">
        <span>{text.footer}</span>
        <span>physics.ideasearch.cn</span>
      </footer>
    </main>
  );
}
