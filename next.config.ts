import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dev proxy — forwards /api/* to the DPDPOS backend.
   * The backend (dpdpos_backend) listens on :3000 by default; override
   * BACKEND_URL in .env.local if it runs elsewhere.
   */
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
    return [{ source: "/api/:path*", destination: `${backendUrl}/api/:path*` }];
  },
};

export default nextConfig;
