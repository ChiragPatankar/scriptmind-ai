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

  async headers() {
    return [
      {
        source: "/((?!_next/static|_next/image|favicon.ico|logo.png).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        __name: "(fn => fn)",
      })
    );
    return config;
  },

  experimental: {
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

export default nextConfig;
