import { headers } from "next/headers";
import { IdeaHome } from "@/components/ui/idea-home";
import { PhysicsDirectory } from "@/components/ui/physics-directory";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function HomePage({
  params,
}: HomePageProps) {
  const { lang } = await params;
  const host = (await headers()).get("host") ?? "";
  const physicsHost = host.split(":")[0] === "physics.ideasearch.cn";

  if (physicsHost) {
    return <PhysicsDirectory lang={lang} />;
  }

  return <IdeaHome lang={lang} />;
}
