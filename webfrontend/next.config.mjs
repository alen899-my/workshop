/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [25, 50, 70, 75, 80, 85, 90, 95, 100],
    remotePatterns: [
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  // ── Compression for Core Web Vitals ──
  compress: true,

  // ── HTTP Security + SEO headers ──
  async headers() {
    return [
      {
        // Apply to all public pages
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Stop MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer for analytics without leaking private data
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy — disable unnecessary APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          // XSS protection (legacy browsers)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // HSTS — tell browsers to always use HTTPS (max 1 year)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/images/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Cache public fonts
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  // ── Redirects for SEO — handle old/wrong URLs ──
  async redirects() {
    return [
      // Redirect bare www to non-www (canonical domain)
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.repairo.in" }],
        destination: "https://repairo.in/:path*",
        permanent: true,
      },
      // Redirect old /workshop (singular) to /workshops
      {
        source: "/workshop",
        destination: "/workshops",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
