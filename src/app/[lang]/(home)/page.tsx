import { headers } from "next/headers";
import { IdeaHome } from "@/components/ui/idea-home";
import { PhysicsDirectory } from "@/components/ui/physics-directory";
import { isPhysicsHost } from "@/lib/physics-host";

interface HomePageProps {
  params: Promise<{ lang: string }>;
}

export default async function HomePage({
  params,
}: HomePageProps) {
  const { lang } = await params;
  const host = (await headers()).get("host") ?? "";
  const physicsHost = isPhysicsHost(host);

  if (physicsHost) {
    return <PhysicsDirectory lang={lang} />;
  }

  return <IdeaHome lang={lang} />;
}
