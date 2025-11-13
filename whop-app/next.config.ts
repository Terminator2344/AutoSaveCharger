import { withWhopAppConfig } from "@whop/react/next.config";
import type { NextConfig } from "next";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)));

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{ hostname: "**" }],
  },
  turbopack: {
    root: projectRoot,
  },
};

export default withWhopAppConfig(nextConfig);
