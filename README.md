# OT Connect Israel

A two-sided marketplace connecting private occupational therapists in Israel with patients.

## Stack

- **Framework:** Next.js 16+ (App Router) + TypeScript (strict)
- **Database:** MongoDB Atlas (eu-west-1) + Mongoose
- **Auth:** NextAuth.js v5
- **i18n:** next-intl — Hebrew (RTL), Arabic (RTL), English
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Payments:** PayPlus / Cardcom (Israeli processors)
- **Email:** Resend
- **Storage:** AWS S3 eu-west-1 — `ot-connect-dev-uploads` / `ot-connect-prod-uploads`
- **Hosting:** AWS App Runner + ECR (eu-west-1) — `ot-connect-dev` / `ot-connect-prod`
- **Analytics:** Posthog

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (or local MongoDB)

### Setup

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env.local
# Fill in .env.local with your values

# Start dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Navigating to `/` will redirect to `/he/` (Hebrew default).

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run Vitest tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run format` | Format with Prettier |

## Project Structure

```
src/
├── app/
│   ├── [locale]/           — All locale-aware pages (he/ar/en)
│   │   ├── (public)/       — Public pages (home, search, OT profiles)
│   │   ├── (auth)/         — Login, register, password reset
│   │   ├── (ot)/           — OT dashboard (protected)
│   │   ├── (patient)/      — Patient account (protected)
│   │   └── (admin)/        — Admin dashboard (protected)
│   └── api/                — API routes
├── components/
│   ├── ui/                 — shadcn/ui base components
│   ├── search/             — Search-specific components
│   ├── profile/            — OT profile components
│   └── dashboard/          — Dashboard components
├── i18n/                   — next-intl routing + request config
├── lib/
│   ├── db/                 — MongoDB connection + Mongoose models
│   ├── auth/               — NextAuth config
│   ├── search/             — Atlas Search query builders
│   └── payments/           — PayPlus/Cardcom integration
├── messages/               — i18n translation files (he/ar/en)
├── middleware.ts            — next-intl locale routing middleware
└── types/                  — Shared TypeScript types
```

## Locales

| Locale | Language | Direction | URL prefix |
|---|---|---|---|
| `he` | Hebrew (default) | RTL | `/he/...` |
| `ar` | Arabic | RTL | `/ar/...` |
| `en` | English | LTR | `/en/...` |

## Branch Strategy

```
main              ← Production (protected, PR + manual approval)
dev               ← Staging (protected, PR only)
dev/feat/<n>      ← Feature branches
dev/fix/<n>       ← Bug fixes
dev/hotfix/<n>    ← Critical fixes (branch from main)
dev/infra/<desc>  ← Infrastructure changes
```

## Environment Variables

See `.env.example` for all required variables. Never commit secrets.
