"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const copy = {
  en: {
    language: "中文",
    title: "Detailed balance in large language model-driven agents",
    abstract:
      "We ask whether state-to-state transitions in LLM-driven agents admit an effective potential. Coarse-graining many token trajectories into semantic states lets us test measured forward–reverse probability ratios against a potential landscape across tasks and model snapshots.",
    article: "Read the article ↗",
    enter: "Enter the website ↗",
    imageAlt: "Detailed balance unit transition channel",
  },
  cn: {
    language: "English",
    title: "大语言模型驱动智能体中的细致平衡",
    abstract:
      "我们考察 LLM 驱动智能体的状态转移是否能够由一个有效势描述。将许多 token 轨迹粗粒化为语义状态后，可以在不同任务和模型快照上，用实测的正逆转移概率比检验势能景观。",
    article: "阅读文章 ↗",
    enter: "进入网页 ↗",
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
  const [dimensions, setDimensions] = useState({ width: 1600, height: 1000 });
  const nextLocale = locale === "cn" ? "en" : "cn";
  const languageHref = `/${nextLocale}`;
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
    <main className="physics-directory relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-8 text-foreground sm:px-8">
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

      <div className="pointer-events-auto absolute right-5 top-5 z-20 sm:right-8 sm:top-8">
        <a
          href={languageHref}
          aria-label={text.language}
          className="inline-flex min-h-12 min-w-24 cursor-pointer items-center justify-center rounded-full border border-foreground/15 bg-white/45 px-5 py-3 text-sm font-medium backdrop-blur transition hover:bg-white/75 dark:bg-white/10 dark:hover:bg-white/20"
        >
          {text.language}
        </a>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <h1 className="mb-12 text-center text-4xl font-semibold tracking-[0.18em] text-foreground sm:text-6xl lg:text-7xl">
          PHYSICS OF AI
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <article className="overflow-hidden rounded-[1.5rem] border border-white/75 bg-white/65 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-900">
              <img
                src="/detailed-balance/assets/figs/unit-sketch-square.png"
                alt={text.imageAlt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col p-6 sm:p-7">
              <h2 className="text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                {text.title}
              </h2>
              <p className="mt-4 text-sm leading-6 text-foreground/65 sm:text-base sm:leading-7">
                {text.abstract}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href="https://arxiv.org/abs/2512.10047"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-foreground px-5 py-3 text-xs font-semibold text-background transition hover:-translate-y-0.5"
                >
                  {text.article}
                </a>
                <Link
                  href={detailHref}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-foreground/20 bg-white/35 px-5 py-3 text-xs font-semibold transition hover:-translate-y-0.5 hover:bg-white/70 dark:bg-white/10 dark:hover:bg-white/20"
                >
                  {text.enter}
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
