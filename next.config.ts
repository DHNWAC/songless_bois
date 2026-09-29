import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ponytail: Jimchatdle is a standalone HTML game in public/; port to a React page if it needs shared app state
  async rewrites() {
    return [{ source: "/jimchatdle", destination: "/jimchatdle.html" }];
  },
};

export default nextConfig;
