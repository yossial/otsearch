/**
 * Create or promote a user to admin role.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts --email=you@example.com --name="Your Name" --password=SecurePass1
 *
 * If the user already exists, only the role is updated (password unchanged unless --password is given).
 * If the user doesn't exist, --name and --password are required.
 */

import 'dotenv/config';

if (process.env.NODE_ENV === 'production') {
  console.error('❌  seed-admin must not run in production. Use the /api/admin/bootstrap endpoint instead.');
  process.exit(1);
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/lib/db/models/User';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/otsearch';

function arg(name: string): string | undefined {
  // Support both `-- --name=val` (process.argv) and `--name=val` (npm_config_* env)
  const flag = `--${name}=`;
  return (
    process.argv.find((a) => a.startsWith(flag))?.slice(flag.length) ??
    process.env[`npm_config_${name}`]
  );
}

async function main() {
  const email = arg('email');
  const name = arg('name');
  const password = arg('password');

  if (!email) {
    console.error('Usage: npx tsx scripts/seed-admin.ts --email=<email> [--name=<name>] [--password=<pass>]');
    process.exit(1);
  }

  console.log(`Connecting to ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    const updates: Record<string, unknown> = { role: 'admin' };
    if (password) updates.passwordHash = await bcrypt.hash(password, 12);
    await User.updateOne({ _id: existing._id }, { $set: updates });
    console.log(`✓ User "${existing.name}" (${email}) promoted to admin.`);
    if (password) console.log('  Password updated.');
  } else {
    if (!name || !password) {
      console.error('User not found. Provide --name and --password to create a new admin account.');
      await mongoose.disconnect();
      process.exit(1);
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email: email.toLowerCase(), name, passwordHash, role: 'admin', emailVerified: true });
    console.log(`✓ Admin account created: ${name} (${email})`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
