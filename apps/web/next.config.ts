import type { NextConfig } from "next";

const serverUrl = (process.env.SERVER_URL ?? "http://localhost:3001").replace(
  /\/$/,
  "",
);

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${serverUrl}/api/:path*`,
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
