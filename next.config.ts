import type { NextConfig } from "next";
import { withBetterStack } from "@logtail/next";

// Bundle analyzer for optimization
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "react-markdown",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-scroll-area",
      "react-hot-toast",
      "date-fns",
    ],
  },

  // VPS compatibility settings
  output: "standalone",

  // Compiler optimizations
  compiler: {
    // Remove ALL console statements in production (log, warn, info, debug, error, etc.)
    removeConsole: process.env.NODE_ENV === "production" ? true : false,
  },

  // Turbopack configuration
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Minimal webpack optimizations (let Next.js handle chunking)
  webpack: (config, { isServer }) => {
    // Only add tree shaking optimizations, let Next.js handle bundle splitting
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    // Configure PDF.js worker for client-side only
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
      };
    }

    return config;
  },

  rewrites: async () => {
    return [
      {
        source: "/((?!api/).*)",
        destination: "/static-app-shell",
      },
    ];
  },
  headers: async () => {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

// Wrap with Better Stack first, then bundle analyzer
export default withBundleAnalyzer(withBetterStack(nextConfig));
