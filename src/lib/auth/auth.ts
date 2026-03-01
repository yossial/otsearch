/**
 * Full NextAuth v5 config — used in API routes and Server Components.
 * Imports mongoose + bcryptjs; do NOT import this in middleware.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    // Google OAuth — requires GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET env vars
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        }).lean();
        if (!user) return null;

        const u = user as {
          _id: unknown;
          email: string;
          name: string;
          role: string | null;
          otProfileId: unknown;
          passwordHash: string;
        };

        // OAuth-only accounts have no password hash
        if (!u.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          u.passwordHash
        );
        if (!valid) return null;

        return {
          id: String(u._id),
          email: u.email,
          name: u.name,
          role: u.role,
          otProfileId: u.otProfileId ? String(u.otProfileId) : null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      // Handle OAuth sign-ins: find or create a user in our DB
      if (account?.provider === 'google') {
        try {
          await connectDB();
          let dbUser = await User.findOne({ email: user.email?.toLowerCase() }).lean();

          if (!dbUser) {
            // New OAuth user — create without a role (set in role-select step)
            const created = await User.create({
              email: user.email?.toLowerCase(),
              name: user.name ?? user.email?.split('@')[0] ?? 'User',
              passwordHash: '',
              role: null,
            });
            dbUser = created.toObject();
          }

          const u = dbUser as {
            _id: unknown;
            role: string | null;
            otProfileId: unknown;
          };

          // Attach DB identity to the NextAuth user object so jwt() can read it
          (user as unknown as Record<string, unknown>).id = String(u._id);
          (user as unknown as Record<string, unknown>).role = u.role ?? null;
          (user as unknown as Record<string, unknown>).otProfileId = u.otProfileId
            ? String(u.otProfileId)
            : null;
        } catch {
          return false;
        }
      }
      return true;
    },
  },
});
