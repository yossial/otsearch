import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['he', 'ar', 'en'],
  defaultLocale: 'he',
  localePrefix: 'always',
});

export type Locale = (typeof routing.locales)[number];
