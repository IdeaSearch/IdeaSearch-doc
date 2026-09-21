import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isPhysicsHost } from "@/lib/physics-host";

export default async function PhysicsPreviewPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const host = (await headers()).get("host") ?? "";
  if (isPhysicsHost(host)) {
    redirect(`/${lang}`);
  }

  // Keep old internal links working, but make the dedicated Physics domain
  // the single public home for this directory.
  redirect(`https://physics.ideasearch.cn/${lang}`);
}
