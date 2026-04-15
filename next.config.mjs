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
