# OT Connect — UI Design Refactor Plan

> Redesign direction: **Stripe-style clean & editorial** — airy whitespace, Federal Blue + Gold palette, subtle purposeful motion, split hero, minimal floating nav.
>
> Decisions locked: 2026-03-13

---

## 1. Design Philosophy

**Flat 2.0** is the evolution past pure flat design. It reintroduces depth and hierarchy — but **only when depth earns its place**. Shadows signal interactivity or elevation; gradients create intentional direction; decorations for their own sake are out.

**Five pillars:**
1. **Hierarchy over decoration** — contrast, weight, and spacing do all the work
2. **Depth is earned** — a shadow means "this is interactive" or "this floats"; not decoration
3. **Space is content** — whitespace signals quality and makes content scannable
4. **Motion is semantic** — micro-interactions communicate state, not entertainment
5. **System thinking** — consistency creates the premium feel, not individual clever components

**For a healthcare marketplace specifically (Headway, BetterHelp, etc.):**
- Warmth and trust come first — nothing too playful, nothing too clinical
- Photo-forward cards — lead with the human face, not the badge
- Generous whitespace — the UI should feel calm and spacious; healthcare is stressful
- Trust signals embedded in typography hierarchy

---

## 2. Typography

### Font Stack (current: Rubik for Hebrew/Arabic, Inter for Latin)
Keep this combination. No changes needed.

### The Hierarchy Stack

| Level | Use | Weight | Size | Color |
|---|---|---|---|---|
| Display | Hero headline | 700 | `text-4xl md:text-5xl lg:text-6xl` | text-primary |
| H1 | Page title | 700 | `text-3xl` | text-primary |
| H2 | Section heading | 700 | `text-2xl` | text-primary |
| H3 | Card title | 600 | `text-xl` or `text-lg` | text-primary |
| H4 | Section eyebrow / label | 600 | `text-xs uppercase tracking-widest` | text-secondary |
| Body | Default paragraph | 400 | `text-base` (16px) | text-primary |
| Small | Supporting text | 400 | `text-sm` (14px) | text-secondary |
| Micro | Captions, meta | 400 | `text-xs` (12px) | text-secondary/70 |

### Critical Typography Rules

- **Section eyebrows**: always `text-xs font-semibold uppercase tracking-widest` in muted color — premium SaaS signature
- **`text-wrap: balance`** on all headings — prevents awkward orphans
- **`text-wrap: pretty`** on body paragraphs — prevents single-word last lines
- **Letter-spacing**: body = default; labels/eyebrows = `tracking-widest` (+0.1em); hero = `tracking-tight` (−0.02em at large sizes)
- **Line height**: body = `leading-relaxed` (1.625); headings = `leading-tight` (1.1–1.2)
- **`font-bold` (700)**: hero headlines, stat numbers, display text only
- **`font-semibold` (600)**: card titles, button labels, nav items, badges, section headings — replaces `font-bold` everywhere else
- **`font-medium` (500)**: secondary CTAs, labels
- **`font-normal` (400)**: all body text, supporting copy

---

## 3. Color System

### Palette — Federal Blue & Gold
```
Gold:             #FFD60A  — primary CTA buttons, key accents
Amber:            #FFBF1C  — CTA hover/active state
Goldenrod:        #D1A309  — pressed states, secondary badges
Federal Blue:     #00044A  — headings, footer background, dark text
Navy:             #000080  — links, text hover states
BG:               #FFFFFF  — pure white — all main backgrounds
BG-alt:           #F8F9FA  — alternating section background
Surface:          #FFFFFF  — card backgrounds
text-primary:     #00044A  — all headings and primary text
text-secondary:   #4B5563  — supporting copy, labels
text-on-gold:     #00044A  — text ON yellow/gold buttons
text-inverse:     #FFFFFF  — text on Federal Blue backgrounds (footer, dark banners)
```

### Dark Section Rule
**Footer only** uses Federal Blue (`#00044A`) as background. All other sections stay on white/`#F8F9FA`. One "For Therapists" CTA banner may optionally use Federal Blue.

### Borders
Use `rgba(0,4,74,0.08)` (Federal Blue at 8% opacity) for all borders — brand-cohesive, not generic gray. CSS var `--color-border` maps to this.

### Hover Rings
- Yellow CTAs: `ring-2 ring-[#FFD60A]/40`
- Blue elements: `ring-2 ring-[#00044A]/20`

### Chip/Badge Tints
Avoid full-saturation. Use tinted pairs:
```
bg-blue-50   text-blue-700   border border-blue-100
bg-emerald-50 text-emerald-700 border border-emerald-100
bg-amber-50  text-amber-700  border border-amber-100
bg-[#FFD60A]/10 text-[#00044A] border border-[#FFD60A]/30  ← brand chip
```

**Color restraint rule**: max 3 intentional colors per component. Everything else is tints (10–20% opacity), shades (10% darker), or semantic variants.

---

## 4. Spacing

### The 8px Grid
All spacing values are multiples of 4 or 8:
```
4px   — micro: icon gap, badge padding (gap-1, p-1)
8px   — small: tight internal gap (gap-2, p-2)
12px  — compact: small card internal (gap-3, p-3)
16px  — base: standard padding/gap (gap-4, p-4)
20px  — comfortable: larger card padding (p-5)
24px  — spacious: section sub-element (gap-6, p-6)
32px  — generous: between cards (gap-8)
48px  — section internal padding (py-12)
64px  — between major sections (py-16)
80px  — hero section padding (py-20)
96px  — hero on marketing pages (py-24)
```

### Container Max-Widths

| Context | Max-width class |
|---|---|
| Auth forms / onboarding steps | `max-w-md` (448px) |
| Onboarding wizard | `max-w-2xl` (672px) |
| App content (profile edit, etc.) | `max-w-3xl` (768px) |
| Dashboard | `max-w-5xl` (1024px) |
| Admin panel | `max-w-6xl` (1152px) |
| Marketing pages | `max-w-7xl` (1280px) |

**Page padding — universal rule**: `px-4 sm:px-6 lg:px-8` — never deviate.

---

## 5. Border Radius

**Pick two and never deviate:**

| Element | Class | Value |
|---|---|---|
| Cards, panels, modals | `rounded-xl` | 12px |
| Buttons, inputs, select, textareas | `rounded-lg` | 8px |
| Chips, badges, small tags | `rounded-md` | 6px |
| Avatars, status indicators | `rounded-full` | 50% |
| Tooltips, small popovers | `rounded-md` | 6px |

**Never**: `rounded-2xl`, `rounded-3xl` on data cards — too playful for professional tools. `rounded-full` on text buttons — reads as consumer/mobile, not SaaS.

---

## 6. Shadows

### The Elevation Model

| Tier | Use | CSS |
|---|---|---|
| Background | Page bg | `bg-bg-alt` — no shadow |
| Surface | Cards, panels | `border border-border` — no shadow |
| Hover | Interactive card/button hover | `shadow-sm` (adds to border) |
| Float | Dropdowns, menus | `shadow-lg border border-border` |
| Overlay | Modals, dialogs | `shadow-xl` |

**Key rule**: static cards use **only borders**, no shadows. Shadows appear only on hover (to signal lift) or on floating UI (to signal layering). This is the single biggest difference between generic and premium design.

Current shadow tokens to use:
- `shadow-card-hover` — for interactive card hover states
- `shadow-[0_4px_12px_rgba(0,4,74,0.15)]` — for primary button hover (Federal Blue-tinted)
- `shadow-[0_4px_12px_rgba(255,214,10,0.35)]` — for Gold CTA hover (gold-tinted)

---

## 7. Buttons

### Primary CTA
> **Keep as-is**: the current lift + shadow + bg-color-change hover effect is intentional and good.
> Color of the shadow tint can be adjusted per button context, but the pattern stays.

```tsx
className="inline-flex items-center gap-2 rounded-lg bg-[#FFD60A] px-4 py-2 text-sm font-semibold text-[#00044A]
  transition-all duration-200
  hover:-translate-y-px hover:bg-[#FFBF1C] hover:shadow-[0_4px_12px_rgba(255,214,10,0.4)]
  focus-visible:ring-2 focus-visible:ring-[#FFD60A]/40 focus-visible:ring-offset-2
  active:translate-y-0 active:bg-[#D1A309] active:shadow-none
  disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
```

### Secondary / Outline
```tsx
className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-primary
  bg-transparent transition-all duration-200
  hover:border-primary hover:text-primary hover:bg-primary/5
  focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
```

### Ghost / Tertiary
```tsx
className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary
  transition-colors duration-150
  hover:bg-gray-100 hover:text-text-primary"
```

### Destructive (inline, e.g. delete row)
```tsx
className="rounded-md px-3 py-1.5 text-sm text-text-secondary
  transition-colors duration-150
  hover:bg-red-50 hover:text-red-600"
```

### Button Rules
- Icon before text on CTAs (→ arrow after for navigation)
- `gap-1.5` or `gap-2` between icon and label
- Loading: spinner replaces icon, button stays same size
- Disabled: `opacity-40 cursor-not-allowed` — never hide disabled buttons
- **Sizes**: two only — default (`py-2`) and large (`py-2.5` or `py-3` for hero CTAs)

---

## 8. Cards

### Standard Card
```tsx
className="rounded-xl border border-border bg-surface p-5
  transition-all duration-200"
```

### Interactive Card (clickable)
```tsx
className="rounded-xl border border-border bg-surface p-5
  transition-all duration-200 cursor-pointer
  hover:-translate-y-0.5 hover:shadow-card-hover hover:border-primary/20"
```

### Hero Card (with gradient bar — e.g. dashboard header card)
```tsx
<div className="overflow-hidden rounded-xl border border-border bg-surface">
  <div className="h-[3px] bg-gradient-to-r from-primary via-primary-mid to-accent" />
  <div className="p-5">
    {/* content */}
  </div>
</div>
```

### Section Headings Inside Cards
```tsx
<div className="flex items-center gap-2 mb-4">
  <IconName className="h-4 w-4 text-text-secondary" strokeWidth={1.5} />
  <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
    Section Label
  </span>
</div>
```

---

## 9. Form Inputs

### Standard Input
```tsx
className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm
  transition-colors duration-150
  focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
  placeholder:text-text-secondary/50
  disabled:opacity-50 disabled:cursor-not-allowed"
```

### Rules
- All inputs: `rounded-lg` (8px)
- Focus ring: `ring-2 ring-primary/20` (not outline-based)
- Error state: `border-red-400 ring-2 ring-red-400/20`
- Label: `text-sm font-medium text-text-primary mb-1`
- Helper/error text: `text-xs text-text-secondary mt-1` / `text-xs text-red-500 mt-1`

---

## 10. Transitions and Motion

### Duration Hierarchy
```
100–150ms  — instant feedback (color/opacity only)
200ms      — hover states, small layout shifts
250–300ms  — modals/sheets entering
350–400ms  — page-level transitions
```

### Easing
- Hover states (entering): `ease-out` — fast start, decelerates (responsive)
- Hover states (leaving): `ease-in` — accelerates out (intentional)
- Spring/bounce (dropdowns, modals): `cubic-bezier(0.34, 1.56, 0.64, 1)`
- **Never `ease-linear`** — feels mechanical

### Standard Transition Classes
```
transition-colors duration-150  → color/bg/border changes only
transition-all duration-200     → includes transform (hover lift)
```

### The Hover Lift Pattern
Primary CTA: `hover:-translate-y-px` (1px — subtle)
Interactive cards: `hover:-translate-y-0.5` (2px — more pronounced)
Always combine with a shadow appearing simultaneously.

---

## 11. Icons

- **One library**: Lucide React (already in use)
- **One stroke width**: `strokeWidth={1.5}` — lighter, more refined than default 2
  - Exception: `strokeWidth={2}` for small inline icons where 1.5 would look too thin
- **Sizes**: `h-4 w-4` (16px inline), `h-5 w-5` (20px action), `h-6 w-6` (24px hero/stat)
- **Color**: inherit from parent text color, or explicit `text-text-secondary`
- **Never mix**: don't use emoji and Lucide icons in the same context

---

## 12. Section Layout (Marketing Pages)

### Background Alternation Pattern
```
Navbar:              transparent → white/80 backdrop-blur on scroll
Hero:                #FFFFFF (white) — split layout, text left + cards right
Stats bar:           #F8F9FA
How It Works:        #FFFFFF
Therapist grid:      #F8F9FA
Why Join Us:         #FFFFFF / #F8F9FA split cols
What Is OT:          #FFFFFF
Map:                 #F8F9FA
For Therapists CTA:  #00044A (Federal Blue) — optional dark section
Contact:             #F8F9FA
Footer:              #00044A (Federal Blue, text-inverse)
```

No borders between sections — the alternation provides structure without visual noise.

### Navbar — Minimal Floating
```tsx
// Transparent at top, frosted white on scroll
className="fixed top-0 z-50 w-full transition-all duration-200
  [&.scrolled]:bg-white/90 [&.scrolled]:backdrop-blur-md [&.scrolled]:shadow-sm"
```
- Logo + 3–4 nav links + single primary CTA button
- On scroll-top: transparent, text in Federal Blue
- On scroll: white/90 frosted glass with subtle shadow

### Hero — Split Layout
```
Left col (text):
  - Eyebrow tag (small, muted)
  - Display headline (text-4xl md:text-5xl lg:text-6xl, font-bold, Federal Blue)
  - Subheadline (text-lg text-secondary)
  - Search bar (prominent, full-width on mobile)
  - Trust stats (200+ therapists · All HMOs · Certified)

Right col (visual):
  - 2–3 floating therapist cards (staggered, shadow, slight rotation)
  - Cards show: photo, name, specialty, star rating, "Accepting" badge
```

---

## 13. The 12 Premium Signals Checklist

These are what separates premium from generic:

- [ ] **Typographic precision**: every semantic level has one canonical size/weight
- [ ] **Barely-there borders**: `border-black/8` not `border-gray-200`
- [ ] **Color restraint**: max 3 intentional colors per component
- [ ] **Hover states on everything interactive**: without exception
- [ ] **Icon consistency**: one library, one stroke width, sizes at 16/20/24 only
- [ ] **Purposeful empty states**: illustration + heading + CTA (not blank space)
- [ ] **`focus-visible` rings on every interactive element**: brand color at 30% opacity
- [ ] **Loading states in context**: skeletons or spinners, never frozen UI
- [ ] **One signal at a time**: bold = important, color = interactive, underline = external
- [ ] **Consistent border-radius**: two values only, applied consistently
- [ ] **Shadows with meaning**: only on floating UI; cards use borders
- [ ] **Section rhythm via background alternation**: no borders between sections

---

## 14. Page-by-Page Refactor Plan

### Priority 1: Global (affects everything)
- [ ] Audit all `font-bold` → replace with `font-semibold` except hero/display/stat numbers
- [ ] Standardize all card `rounded-*` → `rounded-xl`
- [ ] Standardize all button/input `rounded-*` → `rounded-lg`
- [ ] Add `text-wrap: balance` to all `<h1>`, `<h2>`, `<h3>` in globals.css
- [ ] Verify `focus-visible` rings exist on all interactive elements
- [ ] Verify `transition-all duration-200` on all interactive cards
- [ ] Verify `hover:-translate-y-px` on all primary buttons

### Priority 2: Homepage
- [ ] Hero section: verify CTA button has lift + shadow hover
- [ ] TherapistCard: verify hover lift + shadow + border-primary/20
- [ ] HowItWorks step cards: `rounded-xl p-5` + hover lift
- [ ] Pricing cards: `rounded-xl p-6` + hover lift on free tier
- [ ] WhatIsOT specialty cards: `rounded-xl` + hover lift
- [ ] ContactSection form: input focus rings + button hover lift
- [ ] Section eyebrows: `text-xs font-semibold uppercase tracking-widest`

### Priority 3: Therapist Profile Pages
- [ ] Public profile hero card: gradient bar, hover states on CTAs
- [ ] Sidebar chips: `rounded-md border border-border text-sm` tint style
- [ ] Contact page cards: `rounded-xl`

### Priority 4: Dashboard
- [ ] All stat cards: `rounded-xl border border-border`
- [ ] Completeness ring card: gradient bar header
- [ ] ProfileEditForm: input focus rings, save button hover
- [ ] Image upload area: hover state

### Priority 5: Admin
- [ ] All data cards: `rounded-xl`
- [ ] Table wrappers: `rounded-xl overflow-hidden`
- [ ] Form inputs in SettingsForm: focus rings

### Priority 6: Auth / Onboarding
- [ ] Login/Register cards: `rounded-xl`
- [ ] Onboarding wizard step card: `rounded-xl`
- [ ] All inputs: focus rings + `rounded-lg`
- [ ] All buttons: hover lift + focus rings

---

## 15. Hebrew Font Recommendation

**Current**: Rubik (added recently — good choice for body + headings)

**Assessment**:
- **Rubik**: Rounded, friendly, modern. Best for neutral professional tone. ✅ Keep.
- **Assistant**: Clean, geometric, high legibility at small sizes — best body text alternative
- **Heebo**: Similar to Roboto, very clean, excellent for dense data/admin views
- **Secular One**: Display only — dramatic headlines, not suitable for body
- **Frank Ruhl Libre**: Serif — warm and literary, trust-building for healthcare context

**Recommendation**: Keep Rubik as current font. If a refresh is wanted:
- **Option A (minimal change)**: Keep Rubik everywhere — it's already good
- **Option B (refined)**: Frank Ruhl Libre for hero headings (serif = trust) + Rubik for everything else
- **Option C (modern)**: Assistant for body text + Rubik for headings (better readability at `text-sm`)

---

---

## 16. Motion Guidelines

**Level**: Subtle & purposeful (Stripe-level restraint).

- Scroll-triggered: fade-in + slight upward translate (`opacity-0 translate-y-4 → opacity-100 translate-y-0`) on section enter
- Cards: `hover:-translate-y-0.5 hover:shadow-card-hover` — gentle lift only
- Buttons: `hover:-translate-y-px` + shadow change — immediate feedback
- Navbar: `transition-all duration-200` between transparent and frosted states
- No entrance animations on above-the-fold content — it must render instantly
- No looping animations, no parallax, no scroll-jacking

---

*Document status: Decisions locked 2026-03-13. Ready for implementation.*
