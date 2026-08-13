import { env } from "@crossval/env/web";
import type { NextConfig } from "next";

const apiUpstreamUrl = env.API_UPSTREAM_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUpstreamUrl}/api/:path*`,
      },
    ];
  },
  devIndicators: false,
  typedRoutes: true,
  reactCompiler: true,
  images: {
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
