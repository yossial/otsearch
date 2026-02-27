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

      // Protect /[locale]/onboarding — must be logged in
      if (/^\/(he|ar|en)\/onboarding/.test(pathname)) {
        if (!isLoggedIn) {
          const locale = pathname.split('/')[1] ?? 'he';
          const loginUrl = new URL(`/${locale}/auth/login`, request.url);
          return NextResponse.redirect(loginUrl);
        }
      }

      // Redirect logged-in users with no role to role-select
      // (exempts: auth pages, API routes, and the role-select page itself)
      if (isLoggedIn) {
        const role = (auth?.user as { role?: string | null } | undefined)?.role;
        const isRoleSelectPage = /^\/(he|ar|en)\/auth\/role-select/.test(pathname);
        const isAuthPage = /^\/(he|ar|en)\/auth/.test(pathname);
        const isOnboardingPage = /^\/(he|ar|en)\/onboarding/.test(pathname);

        if (!role && !isRoleSelectPage && !isAuthPage && !isOnboardingPage) {
          const locale = pathname.split('/')[1] ?? 'he';
          return NextResponse.redirect(
            new URL(`/${locale}/auth/role-select`, request.url)
          );
        }
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      // Update token from session.update() calls (used after role selection)
      if (trigger === 'update' && session) {
        const s = session as { role?: string | null; otProfileId?: string | null };
        if (s.role !== undefined) token.role = s.role;
        if (s.otProfileId !== undefined) token.otProfileId = s.otProfileId;
      }
      if (user) {
        token.role = (user as { role?: string | null }).role ?? null;
        token.otProfileId = (user as { otProfileId?: string | null }).otProfileId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as unknown as Record<string, unknown>).role = token.role ?? null;
        (session.user as unknown as Record<string, unknown>).otProfileId = token.otProfileId;
      }
      return session;
    },
  },
  providers: [], // Credentials + Google providers added in auth.ts (Node.js only)
};
