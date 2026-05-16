import type { NextConfig } from "next";

// Derive the Clerk frontend API host from the publishable key at build/runtime.
// Format: pk_test_<base64(instanceId.clerk.accounts.dev$)>
const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const clerkFapiHost = clerkPubKey
  ? Buffer.from(clerkPubKey.replace(/^pk_(test|live)_/, ""), "base64")
      .toString("utf8")
      .replace(/\$$/, "") // strip trailing $
  : "*.clerk.accounts.dev";

// https://clerk.com/docs/security/clerk-csp
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Clerk FAPI + Cloudflare Turnstile (CAPTCHA on sign-in/sign-up)
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://${clerkFapiHost} https://challenges.cloudflare.com`,
  `style-src 'self' 'unsafe-inline' https://${clerkFapiHost}`,
  "img-src 'self' data: blob: https: https://img.clerk.com",
  `font-src 'self' data: https://${clerkFapiHost}`,
  "worker-src 'self' blob:",
  // wss: for Clerk's real-time session sync
  "connect-src 'self' https: wss:",
  `frame-src 'self' https://${clerkFapiHost} https://challenges.cloudflare.com https://accounts.google.com https://appleid.apple.com`,
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
