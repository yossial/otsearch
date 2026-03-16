# Dashboard Redesign Plan
> Combines: tabs layout · hide complete-profile card · collapsible cards · premium gating
> Last updated: 2026-03-15

---

## Goal

Replace the current flat single-page dashboard with a tabbed shell. The hero card stays fixed at the top; below it sits a tab bar giving first-class navigation to each premium section. The old link-cards (Patients / Schedule / Billing) are removed — the tabs replace them.

---

## New Information Architecture

```
/dashboard            → Overview tab  (profile, stats, upgrade — free + premium)
/dashboard/patients   → Patients tab  (premium only)
/dashboard/schedule   → Schedule tab  (premium only)
/dashboard/billing    → Billing tab   (premium only)
```

Sub-pages (`/dashboard/patients/[id]`, sessions, etc.) remain full pages. The layout renders the hero + tabs on all dashboard routes; the active tab is highlighted via pathname matching, so sub-pages keep context (e.g. patient detail = Patients tab highlighted).

---

## Architecture

### New: `src/app/[locale]/dashboard/layout.tsx`
Async Server Component. Single source of truth for the dashboard chrome.

Responsibilities:
- Auth check (redirect to login if not therapist)
- Fetch TherapistProfile (hero card data + `isPremium`)
- Render hero card (moved out of `page.tsx`)
- Render `<DashboardTabs isPremium locale>` (client component)
- Render `{children}`
- Owns `min-h-screen bg-bg-alt` wrapper so pages don't repeat it

Individual pages keep their own auth checks (security in depth) but no longer render the outer wrapper or hero.

### New: `src/components/dashboard/DashboardTabs.tsx`
Client component (`usePathname`).

Props: `isPremium: boolean`, `locale: string`

| Tab | Route match | Icon | Locked if free |
|---|---|---|---|
| Overview | `pathname === '/{locale}/dashboard'` | grid/home | — |
| Patients | `pathname.startsWith('/{locale}/dashboard/patients')` | users | yes |
| Schedule | `pathname.startsWith('/{locale}/dashboard/schedule')` | calendar | yes |
| Billing | `pathname.startsWith('/{locale}/dashboard/billing')` | receipt | yes |

Locked tabs: still rendered, show a lock icon, clicking navigates to the route (which shows an upgrade prompt).

RTL: tab bar uses `flex-row`, icons + labels, logical padding. Active tab: `border-b-2 border-primary text-primary`.

---

## Step-by-Step Implementation

### Step 1 — Create layout.tsx

```
src/app/[locale]/dashboard/layout.tsx
```

- Move hero card JSX from `page.tsx` into here
- Move `calcCompleteness` and `StatItem` helpers here (or to a shared util)
- Fetch profile via `getTherapistProfileById`
- Render: hero card → `<DashboardTabs>` → `<div className="...container...">{children}</div>`
- Container: `mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-5`

### Step 2 — Create DashboardTabs.tsx

```
src/components/dashboard/DashboardTabs.tsx
```

- `'use client'`
- Sticky tab bar below hero: `sticky top-16 z-10 bg-bg border-b border-border`
- Tab items: `<Link>` with active underline state
- For locked tabs (free tier): render as `<Link>` to the route (the page itself shows the upgrade prompt)
- Do NOT disable locked tabs — let the page handle the premium wall

### Step 3 — Refactor Overview page (`/dashboard/page.tsx`)

Remove:
- Hero card JSX (moved to layout)
- Clinic tools grid (tabs replace this)
- `min-h-screen bg-bg-alt` outer wrapper

Keep & update:
- **Profile Completeness card** — HIDE ENTIRELY when `completenessScore === 100` (not just hide the CTA link)
- **Profile Strength card** — keep rating + subscription display
- **Upgrade banner** — keep for free tier; move to bottom of overview
- When completeness === 100 AND isPremium: show a clean "You're all set" state instead of two mostly-empty cards (optional — see notes)

### Step 4 — Refactor sub-pages

Each of the 3 premium pages needs:
- Remove `<div className="min-h-screen bg-bg-alt">` outer wrapper (layout owns this)
- Remove inner container div — layout owns `max-w-5xl` container too...

  **Decision:** Layout provides `max-w-5xl` container. Pages render content directly. Pages that need a different max-width (patients uses `max-w-4xl`) can override with their own wrapper.

`patients/page.tsx`:
- Remove outer `min-h-screen bg-bg-alt` + container div
- Content starts directly at the page header + stats + PatientList

`schedule/page.tsx`:
- Remove outer wrapper
- `<ScheduleTabs>` renders directly

`billing/page.tsx`:
- Remove outer wrapper
- Remove duplicate header card with gradient-bar (layout has the hero)
- Keep: page-level header with "New Invoice" button
- Keep: premium check — show upgrade prompt inline (styled to fit within the tabbed layout, not a whole-page redirect)
- Upgrade prompt inside billing: `card p-8 text-center` with upgrade CTA

### Step 5 — i18n

Add to `he.json`, `ar.json`, `en.json`, `ru.json` under `dashboard`:

```json
"tabs": {
  "overview": "סקירה כללית",
  "patients": "מטופלים",
  "schedule": "לו\"ז",
  "billing": "חשבונות"
}
```

### Step 6 — Collapsible cards (Overview tab)

Make Profile Completeness card and Profile Strength card collapsible:
- Add a `<CollapsibleCard>` client component (or use shadcn Collapsible)
- Default: expanded
- Collapsed state: just shows the card title + score badge
- Persist collapsed state in localStorage

---

## Combining Backlog Tasks

| Backlog item | Status | Where handled |
|---|---|---|
| Hide "Complete Profile" card when 100% | ✅ included | Step 3 — card hidden when score === 100 |
| Collapsible cards | ✅ included | Step 6 |
| Tabs layout | ✅ core of this plan | Steps 1–4 |

---

## Files Summary

| Action | File |
|---|---|
| CREATE | `src/app/[locale]/dashboard/layout.tsx` |
| CREATE | `src/components/dashboard/DashboardTabs.tsx` |
| MODIFY | `src/app/[locale]/dashboard/page.tsx` |
| MODIFY | `src/app/[locale]/dashboard/patients/page.tsx` |
| MODIFY | `src/app/[locale]/dashboard/schedule/page.tsx` |
| MODIFY | `src/app/[locale]/dashboard/billing/page.tsx` |
| MODIFY | `src/messages/{he,ar,en,ru}.json` |

---

## Open Questions / Decisions Needed

1. **Collapsible cards**: Use shadcn `<Collapsible>` or a lightweight custom toggle? Recommend shadcn.
2. **"All set" state**: When score is 100% AND premium — should the Overview tab show something useful (e.g. recent activity, quick actions) instead of two empty cards? Could defer to v2.
3. **Edit page** (`/dashboard/edit`): Gets the hero + tabs from layout automatically. The "Overview" tab will be highlighted (closest match). Is this fine, or should we suppress tabs on the edit page?
4. **Patients sub-pages**: Patient detail, session pages, etc. will show the Patients tab highlighted. Back navigation is handled by each page's own back link. Fine?

---

## Notes

- The `auth()` call is deduped by React cache — no extra DB round-trips from multiple auth() calls across layout + pages.
- The layout must NOT break the edit page, patient detail pages, or any other dashboard sub-route.
- Keep `edit/page.tsx` unchanged — it'll just inherit the layout chrome.
- After this redesign, the confetti/milestone task (backlog) fits naturally on the Overview tab.
