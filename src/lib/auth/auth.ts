/**
 * Full NextAuth v5 config — used in API routes and Server Components.
 * Imports mongoose + bcryptjs; do NOT import this in middleware.
 */
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
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

        const valid = await bcrypt.compare(
          credentials.password as string,
          (user as { passwordHash: string }).passwordHash
        );
        if (!valid) return null;

        const u = user as {
          _id: unknown;
          email: string;
          name: string;
          role: string;
          otProfileId: unknown;
        };
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
});
