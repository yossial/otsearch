# OT Connect — Task Board

> Read this at the start of every session to know exactly where we are.
> Update checkboxes and notes as work progresses.
> Last updated: 2026-03-15

---

## Active: Design Refactor (feat/151-homepage-redesign)

**Palette**: Navy Blue `#000080` (primary) · Gold `#FFD60A` (accent) · White `#FFFFFF` (base)
**Hover**: `#0000B6` (same distance step from primary)
**Vibe**: Stripe-style, airy & spacious, minimal floating nav, split hero, subtle motion
**Full spec**: `docs/design-refactor.md`

---

### P1 — Global ✅ DONE

- [x] `tokens.css` — palette updated: primary `#000080`, hover `#0000B6`, accent Gold, bg-dark Federal Blue footer
- [x] `globals.css` — h1-h6 `font-normal`; `.section-eyebrow` `font-normal`; focus ring updated
- [x] Font weights — full sweep: all `font-bold/semibold/medium` → `font-normal` across entire src
- [x] Font families — DM Sans (LTR) + Assistant (RTL), Calistoga (display)
- [x] Button hover shadows — updated to `rgba(0,0,128,…)` sitewide
- [x] All hardcoded `rgba(0,4,74,…)` replaced with `rgba(0,0,128,…)` across components

---

### P2 — Navbar ✅ DONE

- [x] Transparent on scroll-top, frosted glass on scroll (threshold `> 10`)
- [x] Register CTA → `bg-primary text-white` (navy)
- [x] RTL: `dir` on Dropdown; no changes needed

---

### P3 — Homepage Hero ✅ DONE

- [x] Split layout: text left + HeroGraphic right
- [x] Hero background: clean white (gradient removed)
- [x] Reduced top padding: `pt-6 sm:pt-8 lg:pt-12`
- [x] Eyebrow pill: more noticeable (`border-primary/40 bg-primary/8`)
- [x] Headline: gradient text `#000080 → #D1A309` via `HeroTitleHighlight`
- [x] Headline duplicate removed: "Skip the waiting list" only in eyebrow pill
- [x] Description: `text-base`, color `#374151` (darker)
- [x] HeroGraphic: offset frame + gold corner accent + gold line accent (no floating cards)
- [x] Primary CTA → `bg-primary text-white`

---

### P4 — Homepage Sections ✅ DONE

- [x] **StatsBar** — `bg-bg-dark`, gold accent numbers, dot texture
- [x] **TherapistGrid** — `bg-bg-alt`; TherapistCard updated
- [x] **HowItWorks** — `bg-surface`; step cards hover lift; connector Federal Blue
- [x] **WhyJoinUs** — light/dark split; eyebrows; CTA buttons navy
- [x] **WhatIsOT** — `bg-bg`; specialty chips
- [x] **Pricing** — `bg-bg-alt`; free tier CTA navy; premium `border-accent`
- [x] **Testimonials** — `bg-bg-alt`; cards hover
- [x] **TherapistCTABanner** — `bg-primary`; white headline; outline CTA
- [x] **ContactSection** — `bg-bg-alt`; input focus rings via `focus:ring-primary/30`
- [x] **FAQ** — accordion; `bg-bg-alt`
- [x] **Footer** — `bg-bg-dark`; gold hover on links (`hover:text-accent`)

---

### P5 — Therapist Public Profile ✅ DONE

- [x] Hero card: `gradient-bar` accent, avatar ring, name, badges, stats, CTAs
- [x] CTA buttons: navy primary + border secondary
- [x] Sidebar chips: `bg-primary-light text-primary` (specialisations) / `bg-bg-alt` (insurance)
- [x] Session type chips: `border-border` bordered
- [x] Contact form: inside `.card` panel

---

### P6 — Therapist Dashboard ✅ DONE

- [x] Hero card: `gradient-bar`, avatar, CTAs, stats bar
- [x] Completeness ring: `var(--color-primary)` stroke
- [x] Upgrade banner: `bg-primary-light border-primary/20`; CTA `bg-primary`
- [x] All CSS var based — auto-updates with token change

---

### P7 — Admin ✅ DONE

- [x] Stat cards: `.card p-5` with `section-eyebrow` labels
- [x] Bar chart: `bg-primary` bars
- [x] Ratio bars: `bg-primary` / `bg-accent` / `bg-green-500`
- [x] All CSS var based — auto-updates

---

### P8 — Auth / Onboarding ✅ DONE

- [x] Login/Register: `rounded-xl bg-surface border border-border` cards
- [x] Submit buttons: `bg-primary` via Button component
- [x] Input focus rings: `focus:ring-primary/30` in form components
- [x] Onboarding: uses Button + input components, auto-inherits

---

## Backlog (after design refactor)

- [x] Run CI checks — lint/typecheck/test/build all pass
- [x] Raise PR: `feat/151-homepage-redesign` → `dev` — PR #162
- [x] Patient Management Platform — Stories 7.1–7.8 complete
- [ ] Persistent breadcrumb component — all non-landing pages (dashboard, admin, auth, onboarding, therapist profile). Auto-generates from route segments. RTL-aware arrow direction.
- [ ] Dashboard UX improvements:
  - [ ] Hide "Complete Profile" card when profile is already complete (0% remaining)
  - [ ] Make all dashboard cards except the top hero card collapsible
  - [ ] Tabs layout: put "Complete Profile" + adjacent card in a "Profile" tab; one tab per patient management card (Patients, Schedule, Billing)
- [ ] Confetti + celebratory message on milestone completions (onboarding wizard finish, first patient added, etc.)

---

## Done ✓

Design Refactor P1–P8 complete as of 2026-03-14.
Pill contrast fix (section-eyebrow color: inherit + CTA dark-section pill text-white) — 2026-03-15.
