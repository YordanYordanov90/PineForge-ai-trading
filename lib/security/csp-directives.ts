/**
 * Extra CSP directives merged with Clerk's strict nonce-based policy in
 * `proxy.ts`. Keeps the same coverage as the former `next.config.ts` header
 * without `unsafe-inline` / `unsafe-eval` on scripts in production.
 */
export const clerkStrictCspOptions = {
  strict: true,
  directives: {
    'base-uri': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'img-src': ['data:', 'blob:', 'https:'],
    'font-src': ['data:'],
    'connect-src': ['https:', 'wss:'],
    'frame-src': [
      'https://accounts.google.com',
      'https://appleid.apple.com',
      'https://m.stripe.network',
    ],
    'upgrade-insecure-requests': [],
  },
};