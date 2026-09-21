import { redirect } from "next/navigation";

export default async function PhysicsPreviewPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // Backwards-compatible alias for the former `/en/physics` and `/cn/physics`
  // paths. The public directory lives directly at `/{lang}`.
  redirect(`/${lang}`);
}
