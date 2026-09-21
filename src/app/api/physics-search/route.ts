import { physicsSearchResults } from "@/lib/physics-search";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  return Response.json(physicsSearchResults(
    searchParams.get("query") ?? "",
    searchParams.get("locale") ?? "en",
  ));
}
