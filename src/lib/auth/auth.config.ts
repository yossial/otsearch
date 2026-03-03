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

      // Redirect logged-in users with no role to onboarding (therapist setup)
      // Only triggers on dashboard — public pages are freely accessible.
      if (isLoggedIn) {
        const role = (auth?.user as { role?: string | null } | undefined)?.role;
        const isDashboardPage = /^\/(he|ar|en)\/dashboard/.test(pathname);
        const isOnboardingPage = /^\/(he|ar|en)\/onboarding/.test(pathname);

        if (!role && isDashboardPage && !isOnboardingPage) {
          const locale = pathname.split('/')[1] ?? 'he';
          return NextResponse.redirect(
            new URL(`/${locale}/onboarding/therapist`, request.url)
          );
        }
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      // Update token from session.update() calls (used after onboarding)
      if (trigger === 'update' && session) {
        const s = session as { role?: string | null; therapistProfileId?: string | null };
        if (s.role !== undefined) token.role = s.role;
        if (s.therapistProfileId !== undefined) token.therapistProfileId = s.therapistProfileId;
      }
      if (user) {
        token.role = (user as { role?: string | null }).role ?? null;
        token.therapistProfileId =
          (user as { therapistProfileId?: string | null }).therapistProfileId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as unknown as Record<string, unknown>).role = token.role ?? null;
        (session.user as unknown as Record<string, unknown>).therapistProfileId =
          token.therapistProfileId;
      }
      return session;
    },
  },
  providers: [], // Credentials + Google providers added in auth.ts (Node.js only)
};
