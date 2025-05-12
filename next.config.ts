import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // qualquer domínio via HTTPS
      },
    ],
  },
};

export default nextConfig;
