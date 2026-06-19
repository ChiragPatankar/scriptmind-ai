import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {(phase: string) => import('next').NextConfig} */
const buildConfig = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  /** @type {import('next').NextConfig} */
  const nextConfig = {
  // Gzip/Brotli compress all responses
  compress: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
    // Keep images sharp without huge payloads
    formats: ["image/avif", "image/webp"],
  },

  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        __name: "(fn => fn)",
      })
    );
    return config;
  },

  // `optimizePackageImports` rewrites barrel imports into deep imports. It
  // helps the production bundle, but in `next dev` it intermittently breaks
  // module resolution ("Cannot read properties of undefined (reading 'call')"),
  // so enable it for production builds only.
  experimental: isDev
    ? {}
    : {
        // Tree-shake these packages so only used icons/components are bundled
        optimizePackageImports: [
          "lucide-react",
          "framer-motion",
          "recharts",
          "@radix-ui/react-slider",
          "@radix-ui/react-dropdown-menu",
        ],
      },
  };

  return nextConfig;
};

export default buildConfig;
