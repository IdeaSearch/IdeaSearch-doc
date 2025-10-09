"use client";

import { MeshGradient } from "@paper-design/shaders-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface HeroSectionProps {
  lang?: string;
  title?: string;
  highlightText?: string;
  description?: string;
  buttonText?: string;
  readMoreText?: string;
  onButtonClick?: () => void;
  colors?: string[];
  distortion?: number;
  swirl?: number;
  speed?: number;
  offsetX?: number;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  buttonClassName?: string;
  maxWidth?: string;
  veilOpacity?: string;
  fontFamily?: string;
  fontWeight?: number;
}

export function HeroSection({
  lang = "en",
  title,
  highlightText,
  description,
  buttonText,
  readMoreText,
  onButtonClick,
  colors,
  distortion = 0.8,
  swirl = 0.6,
  speed = 0.42,
  offsetX = 0.08,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  buttonClassName = "",
  maxWidth = "max-w-6xl",
  veilOpacity = "bg-white/30 dark:bg-black/40",
  fontFamily = "system-ui, -apple-system, sans-serif",
  fontWeight = 600,
}: HeroSectionProps) {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  // 国际化内容配置
  const i18nContent = {
    en: {
      title: "Optimize Innovation, Break Boundaries",
      highlightText: "IdeaSearch",
      description: "A multi-island parallel search system based on large language models, using evolutionary algorithms and intelligent evaluation mechanisms to help scientific research and education discover breakthrough innovations",
      buttonText: "Start Exploring",
      readMoreText: "Read Articles"
    },
    cn: {
      title: "优化创新 突破边界",
      highlightText: "IdeaSearch",
      description: "基于大语言模型的多岛并行搜索系统，通过进化算法和智能评估机制，帮助科研和教育领域发现突破创新",
      buttonText: "开始探索",
      readMoreText: "阅读文章"
    }
  };

  // 获取当前语言的内容，如果没有提供自定义内容则使用默认内容
  const currentContent = i18nContent[lang as keyof typeof i18nContent] || i18nContent.en;
  const displayTitle = title || currentContent.title;
  const displayHighlightText = highlightText || currentContent.highlightText;
  const displayDescription = description || currentContent.description;
  const displayButtonText = buttonText || currentContent.buttonText;
  const displayReadMoreText = readMoreText || currentContent.readMoreText;

  // 定义浅色和深色主题的色彩搭配
  const lightThemeColors = [
    "#bae6fd",
    "#e9d5ff",
    "#d1f7f9",
    "#dcfce7",
    "#fef9c3",
    "#fee2e2",
  ];

  const darkThemeColors = [
    "#1e293b",
    "#312e81",
    "#164e63",
    "#14532d",
    "#92400e",
    "#991b1b" 
  ];

  // 根据主题选择颜色
  const currentColors = colors || (resolvedTheme === 'dark' ? darkThemeColors : lightThemeColors);

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick();
    }
  };

  return (
    <section
      className={`relative w-full min-h-screen overflow-hidden bg-background flex items-center justify-center ${className}`}
    >
      <div className="fixed inset-0 w-screen h-screen">
        {mounted && (
          <>
            <MeshGradient
              width={dimensions.width}
              height={dimensions.height}
              colors={currentColors}
              distortion={distortion}
              swirl={swirl}
              grainMixer={0}
              grainOverlay={0}
              speed={speed}
              offsetX={offsetX}
            />
            <div
              className={`absolute inset-0 pointer-events-none ${veilOpacity}`}
            />
          </>
        )}
      </div>

      <div className={`relative z-10 ${maxWidth} mx-auto px-6 w-full`}>
        <div className="text-center">
          <h1
            className={`font-bold text-foreground text-balance text-3xl sm:text-4xl md:text-5xl xl:text-6xl leading-tight sm:leading-tight md:leading-tight lg:leading-tight xl:leading-[1.1] mb-6 ${titleClassName}`}
            style={{ fontFamily, fontWeight }}
          >
            {displayTitle}{" "}
            <span className="block mt-2 scale-110 text-transparent bg-clip-text bg-gradient-to-r from-cyan-700 to-purple-600 dark:from-orange-300 dark:to-pink-500">
              {displayHighlightText}
            </span>
          </h1>
          <p
            className={`text-base md:text-xl text-foreground/80 dark:text-white/90 text-pretty max-w-3xl mx-auto leading-relaxed mb-10 px-4 ${descriptionClassName}`}
          >
            {displayDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={handleButtonClick}
              className={`px-6 py-2 sm:px-10 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${buttonClassName}`}
            >
              {displayButtonText}
            </button>
            <a
              href="/"
              className="px-6 py-2 sm:px-10 sm:py-3 rounded-full border-2 border-foreground/20 dark:border-white/30 text-foreground dark:text-white hover:border-foreground/40 dark:hover:border-white/50 font-semibold text-base md:text-lg transition-all duration-300 backdrop-blur-sm"
            >
              {displayReadMoreText}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
