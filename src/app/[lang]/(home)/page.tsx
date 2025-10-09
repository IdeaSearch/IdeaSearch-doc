"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeroSection } from "@/components/ui/hero-section";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default function HomePage({ params }: HomePageProps) {
  const router = useRouter();
  
  const [lang, setLang] = useState<string>("en");
  
  useEffect(() => {
    params.then(({ lang }) => {
      setLang(lang);
    });
  }, [params]);

  const handleButtonClick = () => {
    router.push(`/${lang}/docs/framework`);
  };

  return (
    <main className="min-h-screen">
      <HeroSection
        lang={lang}
        distortion={1.2}
        speed={0.8}
        onButtonClick={handleButtonClick}
      />
    </main>
  );
}
