import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // 301 redirects for renamed /ot/ → /therapist/ routes
      {
        source: '/:locale/ot/:slug',
        destination: '/:locale/therapist/:slug',
        permanent: true,
      },
      {
        source: '/:locale/ot/:slug/contact',
        destination: '/:locale/therapist/:slug/contact',
        permanent: true,
      },
      {
        source: '/:locale/onboarding/ot',
        destination: '/:locale/onboarding/therapist',
        permanent: true,
      },
      {
        source: '/:locale/auth/role-select',
        destination: '/:locale/onboarding/therapist',
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
      {
        // Placeholder avatars used by seed data and profiles without a photo
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
