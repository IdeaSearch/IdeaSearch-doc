"use client";

import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/ui/hero-section";

export default function HomePage() {
  const router = useRouter();

  const handleButtonClick = () => {
    router.push("/docs/framework");
  };

  return (
    <main className="min-h-screen">
      <HeroSection
        distortion={1.2}
        speed={0.8}
        onButtonClick={handleButtonClick}
      />
    </main>
  );
}
