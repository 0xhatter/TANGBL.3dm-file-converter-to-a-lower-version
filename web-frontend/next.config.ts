import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/rhino-8-to-6", destination: "/", permanent: true },
      { source: "/rhino-7-to-6", destination: "/", permanent: true },
      { source: "/rhino-6-to-5", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
