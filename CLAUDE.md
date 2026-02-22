# OT Search — Claude Code Working Guide

## Project Overview

OT Connect Israel is a two-sided marketplace connecting private occupational therapists in Israel with patients.

**Stack:** Next.js 14+ (App Router) · TypeScript (strict) · MongoDB Atlas · NextAuth.js · PayPlus/Cardcom · next-intl (he/ar/en RTL)
**Hosting:** AWS App Runner + ECR · MongoDB Atlas eu-west-1 · Cloudflare CDN
**Styling:** Tailwind CSS + shadcn/ui + RTL plugin
**Payments:** PayPlus / Cardcom (Israeli processors)
**Email:** Resend
**File storage:** AWS S3 / Cloudflare R2
**Analytics:** Posthog

---

## Branch Strategy

```
main              ← Production. Protected. Merge via PR only. Manual approval required.
dev               ← Staging/Dev. Protected. Merge via PR only. Auto-deploy on merge.
feat/<epic-number>   ← Feature branches (e.g. feat/epic-1)
fix/<issue-number>   ← Bug fix branches (e.g. fix/42)
hotfix/<issue-number> ← Critical prod fix. Branch from main. PR into main + dev.
infra/<description>  ← Infrastructure changes
```

> **Note:** Feature branches cannot be prefixed with `dev/` because git treats `dev` (the staging branch) as a path component, making `dev/feat/*` an invalid ref when `dev` already exists.

**Rules:**
- `main` and `dev` are protected — no direct pushes
- All PRs require at least 1 reviewer (yossial)
- PRs must pass all CI checks before merge is allowed
- Squash merge into `dev`, merge commit into `main`
- Delete feature branches after merge

---

## Claude Working Flow

1. **Find next task:** Check GitHub project board (gh cli) for next `in_progress` or highest-priority `backlog` item
2. **Pick up task:** Mark issue as `in_progress`, assign to `yossial`, move to In Progress column
3. **Create branch:** `git checkout -b feat/<epic-number>` from latest `dev`
4. **Implement:** Work through dev tasks, commit at logical checkpoints (not per file)
5. **Tests:** Write and pass tests before raising PR. No PR without passing tests.
6. **Commit format:** `feat(epic-N): <short description>` · `fix(#N): <short>` · `infra: <short>`
7. **PR after Epic:** When a full Epic is complete, raise PR from `dev/feat/<epic-N>` → `dev`
8. **Mark awaiting review:** Move epic issue to `Awaiting Review` column
9. **Next epic:** While waiting for review, immediately start the next epic on a new branch
10. **After PR approval:** Pipeline auto-runs checks + staging deploy. Wait for manual merge by yossial.
11. **Prod PR:** After successful staging deploy, raise PR from `dev` → `main` automatically

---

## CI/CD Pipeline

### On PR → `dev` or `main`:
- `ci / lint` — ESLint
- `ci / typecheck` — TypeScript strict check
- `ci / test` — Vitest unit + integration tests
- `ci / build` — Next.js production build

### On merge → `dev`:
- Build Docker image → push to ECR
- Deploy to App Runner Dev (`ot-connect-dev`)
- Auto-raise PR `dev` → `main` after successful deploy

### On merge → `main` (manual by yossial):
- Build Docker image → push to ECR
- Deploy to App Runner Prod (`ot-connect-prod`) — requires manual GitHub environment approval

---

## GitHub Project Structure

- **Milestone 1** = Phase 1: MVP
- **Milestone 2** = Phase 2: Monetisation
- **Milestone 3** = Phase 3: Growth

**Labels:** `epic` · `story` · `dev-task` · `bug` · `infra` · `design` · `phase-1` · `phase-2` · `phase-3`

**Kanban columns:** `Backlog` · `In Progress` · `Awaiting Review` · `Done`

**Issue hierarchy:**
- Epic issue (label: `epic`) — top-level feature area
- Story issues (label: `story`) — linked to parent Epic via body reference
- Dev task issues (label: `dev-task`) — linked to parent Story

---

## Environment Variables

All secrets in AWS Secrets Manager. Never commit secrets. Only `.env.example` is committed.

Required env vars (see `.env.example`):
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `APP_RUNNER_ROLE_ARN`
- `PAYPLUS_API_KEY`
- `GOOGLE_MAPS_API_KEY`
- `RESEND_API_KEY`
- `S3_BUCKET_NAME` / `S3_REGION`

---

## i18n

- Locales: `he` (Hebrew, RTL), `ar` (Arabic, RTL), `en` (English, LTR)
- URL structure: `/he/...`, `/ar/...`, `/en/...`
- Translation files: `messages/he.json`, `messages/ar.json`, `messages/en.json`
- All UI strings via `next-intl` — no hardcoded strings in components
- CSS: use logical properties (`padding-inline-start`) not directional (`padding-left`)

---

## Code Conventions

- TypeScript strict mode — no `any`
- All new components tested with Vitest + React Testing Library
- Server Components by default; Client Components only when interactive
- shadcn/ui for base components — don't re-invent primitives
- Tailwind for styling — no inline styles, no CSS modules (except globals)
- MongoDB via Mongoose — shared models in `lib/db/models/`
- API routes in `app/api/` — validate inputs, never trust client data
- Auth checks via NextAuth `getServerSession` in Server Components and middleware

---

## Key File Paths

```
app/[locale]/           — All locale-aware pages
app/api/                — API routes
components/ui/          — shadcn/ui base components
components/search/      — Search-specific components
components/profile/     — OT profile components
components/dashboard/   — OT/admin dashboard components
lib/db/                 — MongoDB connection + Mongoose models
lib/auth/               — NextAuth config
lib/search/             — Atlas Search query builders
lib/payments/           — PayPlus/Cardcom integration
messages/               — i18n translation files
types/                  — Shared TypeScript types
infrastructure/         — AWS CDK stacks
```

---

## Phase Summary

| Phase | Milestone | Scope |
|---|---|---|
| Phase 1 MVP | Milestone 1 | OT registration, profile builder, patient search, auth, basic admin, Hebrew + English |
| Phase 2 Monetisation | Milestone 2 | Subscriptions, analytics, featured placements, Arabic, reviews, SMS |
| Phase 3 Growth | Milestone 3 | Lead fees, SEO hub pages, MOH verification, B2B, mobile app |

---

## PR Checklist (before raising PR)

- [ ] All CI checks pass locally (`npm run lint && npm run typecheck && npm run test && npm run build`)
- [ ] Tests written for new logic
- [ ] Tested in Hebrew RTL layout
- [ ] No hardcoded strings — all text via i18n
- [ ] No TypeScript `any` types
- [ ] New env variables documented in `.env.example`
- [ ] No secrets committed
