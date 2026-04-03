import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";
const connectSrc = isProduction
  ? "connect-src 'self' https://e-commerce.kapitalbank.az"
  : "connect-src 'self' ws://localhost:* wss://localhost:* https://e-commerce.kapitalbank.az";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js App Router hydration currently requires inline script/style.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  connectSrc,
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  // Disable DNS prefetching leaking visited URLs
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Force HTTPS for 2 years, include subdomains + preload
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Prevent clickjacking / embedding in iframes
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Legacy XSS filter (belt-and-suspenders for older browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Limit referrer information sent to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable unnecessary browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=(), serial=()" },
  // Content Security Policy
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  // Prevent cross-origin information leaks
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Disable powered-by header (information disclosure)
  poweredByHeader: false,
};

export default nextConfig;
