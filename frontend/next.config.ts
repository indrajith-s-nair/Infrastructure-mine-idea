import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  skipTrailingSlashRedirect: true,
  outputFileTracingRoot: path.join(__dirname, "../"),
  async rewrites() {
    const backendUrl = process.env.INTERNAL_BACKEND_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/:path*/",
        destination: `${backendUrl}/api/:path*/`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/media/:path*/",
        destination: `${backendUrl}/media/:path*/`,
      },
      {
        source: "/media/:path*",
        destination: `${backendUrl}/media/:path*`,
      },
      {
        source: "/admin",
        destination: `${backendUrl}/admin/`,
      },
      {
        source: "/admin/",
        destination: `${backendUrl}/admin/`,
      },
      {
        source: "/admin/:path+/",
        destination: `${backendUrl}/admin/:path+/`,
      },
      {
        source: "/admin/:path+",
        destination: `${backendUrl}/admin/:path+`,
      },
      {
        source: "/admin-console",
        destination: `${backendUrl}/admin/`,
      },
      {
        source: "/admin-console/",
        destination: `${backendUrl}/admin/`,
      },
      {
        source: "/admin-console/:path+/",
        destination: `${backendUrl}/admin/:path+/`,
      },
      {
        source: "/admin-console/:path+",
        destination: `${backendUrl}/admin/:path+`,
      },
      {
        source: "/static/:path*",
        destination: `${backendUrl}/static/:path*`,
      },
    ];
  },
};

export default nextConfig;

