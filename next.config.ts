import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
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
