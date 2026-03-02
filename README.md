# OT Connect Israel

A two-sided marketplace connecting private occupational therapists in Israel with patients.

## Stack

- **Framework:** Next.js 16+ (App Router) + TypeScript (strict)
- **Database:** MongoDB Atlas + Mongoose
- **Auth:** NextAuth.js v5
- **i18n:** next-intl — Hebrew (RTL), Arabic (RTL), English
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Payments:** PayPlus / Cardcom
- **Email:** Resend
- **Storage:** AWS S3 / Cloudflare R2
- **Hosting:** AWS App Runner + ECR
- **Analytics:** Posthog

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for local MongoDB)

### Setup

**1. Pull latest code**
```bash
git pull origin main
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env.local
```

Then generate a value for `NEXTAUTH_SECRET` in `.env.local`:
```bash
openssl rand -base64 32
```

The other variables (AWS, Payments, Maps, Email) can be left blank for local dev unless you're testing those features.

**4. Start MongoDB**
```bash
npm run db:up
```

**5. (Optional) Seed the database**
```bash
npm run seed
```

**6. Start the dev server**
```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

Navigating to `/` will redirect to `/he/` (Hebrew default).

### Troubleshooting

- **Turbopack panic on startup** — another `next dev` process is already running. Kill it and clear the cache:
  ```bash
  taskkill //F //IM node.exe && rm -rf .next && npm run dev
  ```
- **Module not found errors** — dependencies are out of sync, run `npm install`.

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
feat/<n>          ← Feature branches
fix/<n>           ← Bug fixes
hotfix/<n>        ← Critical fixes (branch from main)
infra/<desc>      ← Infrastructure changes
```

## Environment Variables

See `.env.example` for all required variables. Never commit secrets.
