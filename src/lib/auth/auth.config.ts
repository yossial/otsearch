/**
 * Light auth config — no DB or bcrypt imports.
 * Safe to import from middleware (Edge runtime compatible).
 */
import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;

      // Protect /[locale]/admin — must be logged in AND role === 'admin'
      if (/^\/(he|ar|en|ru)\/admin/.test(pathname)) {
        if (!isLoggedIn) {
          const locale = pathname.split('/')[1] ?? 'he';
          const loginUrl = new URL(`/${locale}/auth/login`, request.url);
          loginUrl.searchParams.set('callbackUrl', request.url);
          return NextResponse.redirect(loginUrl);
        }
        const role = (auth?.user as { role?: string | null } | undefined)?.role;
        if (role !== 'admin') {
          const locale = pathname.split('/')[1] ?? 'he';
          return NextResponse.redirect(new URL(`/${locale}`, request.url));
        }
      }

      // Protect /[locale]/dashboard and all sub-paths
      if (/^\/(he|ar|en|ru)\/dashboard/.test(pathname)) {
        if (!isLoggedIn) {
          const locale = pathname.split('/')[1] ?? 'he';
          const loginUrl = new URL(`/${locale}/auth/login`, request.url);
          loginUrl.searchParams.set('callbackUrl', request.url);
          return NextResponse.redirect(loginUrl);
        }
      }

      // Protect /[locale]/onboarding — must be logged in
      if (/^\/(he|ar|en|ru)\/onboarding/.test(pathname)) {
        if (!isLoggedIn) {
          const locale = pathname.split('/')[1] ?? 'he';
          const loginUrl = new URL(`/${locale}/auth/login`, request.url);
          return NextResponse.redirect(loginUrl);
        }
      }

      // Role-based redirects for logged-in users on dashboard/onboarding paths
      if (isLoggedIn) {
        const role = (auth?.user as { role?: string | null } | undefined)?.role;
        const isDashboardPage = /^\/(he|ar|en|ru)\/dashboard/.test(pathname);
        const isOnboardingPage = /^\/(he|ar|en|ru)\/onboarding/.test(pathname);
        const locale = pathname.split('/')[1] ?? 'he';

        // Admins landing on dashboard/onboarding → send to admin panel
        if (role === 'admin' && (isDashboardPage || isOnboardingPage)) {
          return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
        }
        // Note: "no role → onboarding" guard is intentionally NOT here.
        // JWT can be stale right after onboarding. The dashboard page itself
        // does a fresh DB lookup and redirects to onboarding if needed.
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      // Update token from session.update() calls (used after onboarding)
      if (trigger === 'update' && session) {
        const s = session as { role?: string | null; therapistProfileId?: string | null; image?: string | null };
        if (s.role !== undefined) token.role = s.role;
        if (s.therapistProfileId !== undefined) token.therapistProfileId = s.therapistProfileId;
        if (s.image !== undefined) token.picture = s.image;
      }
      if (user) {
        token.role = (user as { role?: string | null }).role ?? null;
        token.therapistProfileId =
          (user as { therapistProfileId?: string | null }).therapistProfileId ?? null;
        const img = (user as { image?: string | null }).image;
        if (img !== undefined) token.picture = img;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.image = (token.picture as string | null | undefined) ?? null;
        (session.user as unknown as Record<string, unknown>).role = token.role ?? null;
        (session.user as unknown as Record<string, unknown>).therapistProfileId =
          token.therapistProfileId;
      }
      return session;
    },
  },
  providers: [], // Credentials + Google providers added in auth.ts (Node.js only)
};
