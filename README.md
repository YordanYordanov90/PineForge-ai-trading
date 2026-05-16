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
cp .env.example .env.local   # add keys (Clerk, XAI_API_KEY, DATABASE_URL, etc.)
npm run dev
```

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
