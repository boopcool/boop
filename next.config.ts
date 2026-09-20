import type { NextConfig } from "next";

/**
 * Only allow remote images from the configured Supabase project. Everything
 * else in the product is either a local SVG or an uploaded file served from
 * Supabase Storage, so the allow-list stays deliberately tiny.
 */
function supabaseImageHost(): { protocol: "https"; hostname: string }[] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];
  try {
    return [{ protocol: "https", hostname: new URL(raw).hostname }];
  } catch {
    return [];
  }
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: supabaseImageHost(),
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // Short share links used on OG cards: boop.cool/t/<slug>
      { source: "/t/:slug", destination: "/results/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
