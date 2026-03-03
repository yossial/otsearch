import NextAuth from 'next-auth';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);
const intl = createIntlMiddleware(routing);

export default auth((req) => {
  // auth.config.ts handles dashboard route protection via the `authorized` callback.
  // intl middleware handles locale prefix routing for all non-API paths.
  return intl(req);
});

export const config = {
  matcher: [
    // Match all pathnames except static files, API routes, and Next.js internals
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
