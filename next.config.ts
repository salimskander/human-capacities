import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: this disables ESLint during build
    // Use only temporarily
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
