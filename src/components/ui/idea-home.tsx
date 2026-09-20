"use client";

import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/ui/hero-section";

export function IdeaHome({ lang }: { lang: string }) {
  const router = useRouter();

  return (
    <main className="min-h-screen">
      <HeroSection
        lang={lang}
        distortion={1.2}
        speed={0.8}
        onButtonClick={() => router.push(`/${lang}/docs/framework`)}
      />
    </main>
  );
}
