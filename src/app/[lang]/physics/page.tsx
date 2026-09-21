import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PhysicsPreviewPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const host = (await headers()).get("host") ?? "";
  if (host.split(":")[0] === "physics.ideasearch.cn") {
    redirect(`/${lang}`);
  }

  // Keep old internal links working, but make the dedicated Physics domain
  // the single public home for this directory.
  redirect(`https://physics.ideasearch.cn/${lang}`);
}
