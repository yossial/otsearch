/**
 * Screenshot all pages of the site.
 * Usage: npx tsx scripts/screenshot-pages.ts
 *
 * Requires the dev server to be running: npm run dev
 * Output: screenshots/ directory (one PNG per route)
 */

import { chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "screenshots");
const LOCALE = "he"; // primary locale for screenshots
const VIEWPORT = { width: 1440, height: 900 };

// Public routes (no auth required)
const PUBLIC_ROUTES = [
  { name: "home", path: `/${LOCALE}` },
  { name: "search", path: `/${LOCALE}/search` },
  { name: "therapist-profile", path: `/${LOCALE}/therapist/michal-cohen` },
  { name: "auth-login", path: `/${LOCALE}/auth/login` },
  { name: "auth-register", path: `/${LOCALE}/auth/register` },
];

// Auth-required routes — we'll screenshot the redirect/loading state
// and also attempt a logged-in session via cookie injection if creds are set
const PROTECTED_ROUTES = [
  { name: "dashboard-home", path: `/${LOCALE}/dashboard` },
  { name: "dashboard-patients", path: `/${LOCALE}/dashboard/patients` },
  { name: "dashboard-patients-new", path: `/${LOCALE}/dashboard/patients/new` },
  { name: "dashboard-schedule", path: `/${LOCALE}/dashboard/schedule` },
  { name: "dashboard-billing", path: `/${LOCALE}/dashboard/billing` },
  { name: "dashboard-edit", path: `/${LOCALE}/dashboard/edit` },
  { name: "onboarding-therapist", path: `/${LOCALE}/onboarding/therapist` },
];

async function ensureServerRunning() {
  try {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error();
  } catch {
    console.error(
      `\n❌  Dev server not reachable at ${BASE_URL}\n   Run: npm run dev\n`
    );
    process.exit(1);
  }
}

async function screenshot(
  page: import("@playwright/test").Page,
  route: { name: string; path: string },
  tag = ""
) {
  const label = tag ? `${tag}_${route.name}` : route.name;
  const outPath = path.join(OUT_DIR, `${label}.png`);
  console.log(`  → ${route.path}`);

  await page.goto(`${BASE_URL}${route.path}`, {
    waitUntil: "networkidle",
    timeout: 15000,
  });

  // 1. Scroll through the page to trigger whileInView animations.
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      const distance = 200;
      const delay = 80;
      let scrolled = 0;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        scrolled += distance;
        if (scrolled >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, delay);
    });
  });
  await page.waitForTimeout(900);

  // 2. Force any elements still invisible (framer-motion whileInView not yet
  //    triggered or mid-animation) to their fully-visible final state.
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
      if (el.style.opacity === '0') {
        el.style.setProperty('opacity', '1', 'important');
      }
      if (el.style.transform && el.style.transform.includes('translateY')) {
        el.style.setProperty('transform', 'none', 'important');
      }
    });
  });

  // 3. Scroll back to top for the full-page capture.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`     saved: ${path.relative(process.cwd(), outPath)}`);
}

async function run() {
  await ensureServerRunning();

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: "he-IL",
    reducedMotion: "reduce", // makes framer-motion skip animations → all content visible
  });
  const page = await context.newPage();

  console.log("\n📸  Public pages");
  for (const route of PUBLIC_ROUTES) {
    await screenshot(page, route, "public");
  }

  console.log("\n📸  Protected pages (unauthenticated — will see redirect/login)");
  for (const route of PROTECTED_ROUTES) {
    await screenshot(page, route, "protected_unauth");
  }

  // Mobile viewport pass on public pages
  await context.close();
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "he-IL",
    reducedMotion: "reduce",
  });
  const mobilePage = await mobileCtx.newPage();

  console.log("\n📸  Public pages — mobile (390px)");
  for (const route of PUBLIC_ROUTES) {
    await screenshot(mobilePage, route, "mobile");
  }

  await mobileCtx.close();
  await browser.close();

  const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\n✅  Done — ${files.length} screenshots saved to screenshots/\n`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
