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

  // The custom domain uses the same locale paths as the main site: `/en` and
  // `/cn`. Keep the query-string preview for local/main-site inspection, but
  // do not introduce a second `/physics` URL scheme for the public domain.
  if (physicsHost || preview) {
    return <PhysicsDirectory lang={lang} preview={preview && !physicsHost} />;
  }

  return <IdeaHome lang={lang} />;
}
