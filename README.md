# PineForge

AI-powered Pine Script v5 generator for TradingView traders. Describe your strategy in plain English; PineForge produces production-ready scripts with alert tiers, stop-loss / take-profit lines, and risk sizing.

**Tagline:** Describe it. PineForge writes it. You trade it.

## Stack

- Next.js 16 (App Router) · React 19 · TypeScript
- Tailwind CSS v4 · shadcn/ui
- Clerk auth · Neon Postgres · Drizzle ORM
- Vercel AI SDK · xAI Grok

## Getting Started

```bash
npm install
# Create .env.local with Clerk, XAI_API_KEY, DATABASE_URL, Upstash Redis, etc.
npm run dev
```

Required env vars (see Vercel / provider dashboards):

- `XAI_API_KEY` — xAI Grok
- Clerk keys (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`)
- `NEXT_PUBLIC_CLERK_PRO_PLAN_ID` — Clerk Billing Pro plan id (`cplan_...`, from Clerk
  Dashboard → Billing → Plans). **Build-time var** — must be set in every Vercel
  environment (Production *and* Preview) before the build runs; adding it after a
  deploy requires a redeploy to take effect. Missing it makes "Upgrade to Pro" fall
  back to a plain link instead of opening checkout.
- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` — Neon Postgres
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — rate limiting on AI routes

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply Drizzle migrations |

## Project context

Agent and contributor docs live in [`context/`](context/) — start with [`context/project-overview.md`](context/project-overview.md).

## Deploy

Deploy on [Vercel](https://vercel.com). Run `drizzle-kit migrate` before the app serves traffic in production.
