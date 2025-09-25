import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@loveymoji/db"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
