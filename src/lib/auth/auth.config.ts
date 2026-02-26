/**
 * Light auth config — no DB or bcrypt imports.
 * Safe to import from middleware (Edge runtime compatible).
 */
import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      // Protect /[locale]/dashboard and all sub-paths
      if (/^\/(he|ar|en)\/dashboard/.test(pathname)) {
        if (!isLoggedIn) {
          const locale = pathname.split('/')[1] ?? 'he';
          const loginUrl = new URL(`/${locale}/auth/login`, request.url);
          loginUrl.searchParams.set('callbackUrl', request.url);
          return NextResponse.redirect(loginUrl);
        }
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.otProfileId = (user as { otProfileId?: string | null }).otProfileId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as unknown as Record<string, unknown>).role = token.role;
        (session.user as unknown as Record<string, unknown>).otProfileId = token.otProfileId;
      }
      return session;
    },
  },
  providers: [], // Credentials provider added in auth.ts (Node.js only)
};
