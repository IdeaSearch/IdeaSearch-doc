import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // pin the workspace root, otherwise Turbopack walks up and picks a lockfile
  // outside this repository
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
};

export default withMDX(config);
