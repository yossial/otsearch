/**
 * Database cleanup script — removes seeded or all data from the local dev database.
 *
 * Usage:
 *   npx tsx scripts/db-clean.ts --seed          # Remove only seed data (safe for dev)
 *   npx tsx scripts/db-clean.ts --all            # Wipe entire database (full reset)
 *   npx tsx scripts/db-clean.ts --seed --yes     # Skip confirmation prompt
 *   npx tsx scripts/db-clean.ts --all  --yes
 *
 * Never runs in NODE_ENV=production.
 */

import 'dotenv/config';
import readline from 'readline';
import mongoose from 'mongoose';
import { TherapistProfile } from '../src/lib/db/models/TherapistProfile';
import { Review } from '../src/lib/db/models/Review';
import { User } from '../src/lib/db/models/User';

if (process.env.NODE_ENV === 'production') {
  console.error('❌  db-clean must not run in production.');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/otsearch';

// ── Seed manifest ──────────────────────────────────────────────────────────────
// Keep in sync with scripts/seed.ts

const SEED_SLUGS = [
  'michal-cohen', 'yosef-levi', 'sara-mizrahi', 'david-peretz', 'hana-shapira',
  'amir-hassan', 'rivka-goldman', 'noa-katz', 'eli-ben-david', 'fatima-abu-ali',
  'tamar-roi', 'ron-ofer', 'orna-friedman', 'gal-bar-oz', 'moshe-dvir',
  'shira-landau', 'avi-nachshon', 'maya-reuveni', 'dan-zarchi', 'rachel-stern',
  'tal-sela',
];

const SEED_THERAPIST_EMAILS = [
  'michal.cohen@therapio.co.il', 'yosef.levi@therapio.co.il', 'sara.mizrahi@therapio.co.il',
  'david.peretz@therapio.co.il', 'hana.shapira@therapio.co.il', 'amir.hassan@therapio.co.il',
  'rivka.goldman@therapio.co.il', 'noa.katz@therapio.co.il', 'eli.bendavid@therapio.co.il',
  'fatima.abuali@therapio.co.il', 'tamar.roi@therapio.co.il', 'ron.ofer@therapio.co.il',
  'orna.friedman@therapio.co.il', 'gal.baroz@therapio.co.il', 'moshe.dvir@therapio.co.il',
  'shira.landau@therapio.co.il', 'avi.nachshon@therapio.co.il', 'maya.reuveni@therapio.co.il',
  'dan.zarchi@therapio.co.il', 'rachel.stern@therapio.co.il', 'tal.sela@therapio.co.il',
];

const SEED_REVIEWER_EMAILS = [
  'yael.cohen@seed.therapio.co.il',
  'roi.benmoshe@seed.therapio.co.il',
  'nadia.petrov@seed.therapio.co.il',
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// ── Modes ──────────────────────────────────────────────────────────────────────

async function cleanSeed() {
  console.log('\nRemoving seeded profiles, reviews, and user accounts...');

  // Find seeded profiles (to delete their reviews by profileId)
  const seededProfiles = await TherapistProfile.find({ slug: { $in: SEED_SLUGS } }, '_id').lean();
  const seededProfileIds = seededProfiles.map((p) => p._id);

  const [profiles, reviews, users] = await Promise.all([
    TherapistProfile.deleteMany({ slug: { $in: SEED_SLUGS } }),
    Review.deleteMany({ therapistProfileId: { $in: seededProfileIds } }),
    User.deleteMany({
      email: { $in: [...SEED_THERAPIST_EMAILS, ...SEED_REVIEWER_EMAILS] },
    }),
  ]);

  console.log(`  Profiles deleted : ${profiles.deletedCount}`);
  console.log(`  Reviews deleted  : ${reviews.deletedCount}`);
  console.log(`  Users deleted    : ${users.deletedCount}`);
}

async function cleanAll() {
  console.log('\nWiping all collections...');

  const [profiles, reviews, users] = await Promise.all([
    TherapistProfile.deleteMany({}),
    Review.deleteMany({}),
    User.deleteMany({}),
  ]);

  console.log(`  Profiles deleted : ${profiles.deletedCount}`);
  console.log(`  Reviews deleted  : ${reviews.deletedCount}`);
  console.log(`  Users deleted    : ${users.deletedCount}`);
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const isSeed = hasFlag('--seed');
  const isAll  = hasFlag('--all');
  const skipConfirm = hasFlag('--yes');

  if (!isSeed && !isAll) {
    console.error('Usage: npx tsx scripts/db-clean.ts [--seed | --all] [--yes]');
    console.error('  --seed  Remove only seeded demo data');
    console.error('  --all   Wipe the entire database');
    process.exit(1);
  }

  const mode = isAll ? 'WIPE ENTIRE DATABASE' : 'remove seed data';
  const uri  = MONGODB_URI;

  console.log(`\nTarget : ${uri}`);
  console.log(`Mode   : ${mode}`);

  if (!skipConfirm) {
    const ok = await confirm(`\nAre you sure you want to ${mode}?`);
    if (!ok) { console.log('Aborted.'); process.exit(0); }
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  if (isAll) await cleanAll();
  else       await cleanSeed();

  console.log('\nDone.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
