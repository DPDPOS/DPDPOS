import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Dev proxy — forwards /api/* to the DPDPOS backend.
   * The backend (dpdpos_backend) listens on :3000 by default; override
   * BACKEND_URL in .env.local if it runs elsewhere.
   *
   * The backend versions its entire API under /api/v1 (register-routes.ts),
   * while the frontend client is deliberately version-agnostic (/api/...),
   * so the version prefix is pinned here at the proxy boundary. Two
   * exceptions are forwarded to the backend root: /healthz (served at /,
   * not under /api/v1) and /readyz.
   */
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3000";
    return [
      { source: "/api/healthz", destination: `${backendUrl}/healthz` },
      { source: "/api/readyz", destination: `${backendUrl}/readyz` },
      { source: "/api/:path*", destination: `${backendUrl}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
