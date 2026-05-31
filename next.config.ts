import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 隐藏左下角 Next.js 开发指示器（给他人演示本地 dev 时更干净）
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
