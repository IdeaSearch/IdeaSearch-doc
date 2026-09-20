import { PhysicsDirectory } from "@/components/ui/physics-directory";

export default async function PhysicsPreviewPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  return <PhysicsDirectory lang={lang} preview />;
}
