import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typedRoutes: true,
  reactCompiler: true,
  images: {
    formats: ["image/webp", "image/avif"],
  },
};

export default nextConfig;
