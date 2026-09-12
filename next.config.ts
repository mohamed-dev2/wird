import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    // microphone fully disabled: voice logging was removed (cloud STT
    // could not stay private), so no feature needs the mic anymore
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

// Strict CSP in production only: dev/HMR needs eval + websockets.
// NOTE: script-src keeps 'unsafe-inline' — Next.js App Router requires it
// for its inline bootstrap (documented); external scripts stay blocked.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://cdn.jsdelivr.net https://api.quran.com",
  "media-src 'self' https://everyayah.com",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: __dirname,
  },
  async headers() {
    const headers = [...securityHeaders];
    if (process.env.NODE_ENV === "production") {
      headers.push({ key: "Content-Security-Policy", value: csp });
    }
    return [
      {
        source: "/:path*",
        headers,
      },
    ];
  },
};

export default nextConfig;
