import { redirect } from 'next/navigation';

// The next-intl middleware redirects / → /he (default locale).
// This page exists only to prevent Turbopack from panicking on a missing
// root endpoint. It should never be rendered in practice.
export default function RootPage() {
  redirect('/he');
}
