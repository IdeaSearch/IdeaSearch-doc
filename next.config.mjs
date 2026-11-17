import { fileURLToPath } from "node:url";
import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // The static phase-diagram delivery requires a trailing slash for its
  // relative URLs. Keep the other routes' existing slash normalization below.
  skipTrailingSlashRedirect: true,
  // pin the workspace root, otherwise Turbopack walks up and picks a lockfile
  // outside this repository
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  async redirects() {
    return [
      {
        source: "/:path((?!phase-diagram(?:/|$)).+)/",
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/phase-diagram/",
        destination: "/phase-diagram/index.html",
      },
      {
        source: "/detailed-balance",
        destination: "/detailed-balance/index.html",
      },
      {
        source: "/susceptibility",
        destination: "/susceptibility/index.html",
      },
    ];
  },
};

export default withMDX(config);
