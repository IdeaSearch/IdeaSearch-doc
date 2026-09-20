import { headers } from "next/headers";
import { IdeaHome } from "@/components/ui/idea-home";
import { PhysicsDirectory } from "@/components/ui/physics-directory";

interface HomePageProps {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ site?: string }>;
}

export default async function HomePage({
  params,
  searchParams,
}: HomePageProps) {
  const { lang } = await params;
  const query = await searchParams;
  const host = (await headers()).get("host") ?? "";
  const physicsHost = host.split(":")[0] === "physics.ideasearch.cn";
  const preview = query.site === "physics";

  if (physicsHost || preview) {
    return <PhysicsDirectory lang={lang} preview={preview} />;
  }

  return <IdeaHome lang={lang} />;
}
