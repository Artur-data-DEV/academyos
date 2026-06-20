import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: ["@academyos/ui"],
  serverExternalPackages: ["mermaid"],
};

export default nextConfig;
