import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 2 MiB avatar originals plus bounded multipart overhead.
    serverActions: { bodySizeLimit: "3mb" },
  },
};

export default nextConfig;
