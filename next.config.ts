import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow any remote image so admins can paste URLs from any source
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
