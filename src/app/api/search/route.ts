import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

// defaults to the `multilingual` tokenizer, which handles both `en` and `cn`
// content with no extra config
export const { GET } = createFromSource(source);
