import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

  // Keep one canonical URL for the Physics of AI directory.  The custom
  // domain and the `?site=physics` preview used to render the same page at
  // different paths, which made the language switch appear disconnected.
  // `/en/physics` and `/cn/physics` are now the shared entry points on both
  // hosts; the custom-domain root is routed here through `/en` first.
  if (physicsHost || preview) {
    redirect(`/${lang}/physics`);
  }

  return <IdeaHome lang={lang} />;
}
