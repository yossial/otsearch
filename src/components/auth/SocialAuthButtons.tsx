'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface SocialAuthButtonsProps {
  callbackUrl?: string;
}

// Google SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Apple SVG icon
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" aria-hidden="true">
      <path d="M14.94 13.48c-.32.72-.47 1.04-.88 1.68-.57.87-1.37 1.95-2.37 1.96-.88.01-1.11-.57-2.3-.56-1.2.01-1.45.57-2.33.56-1-.01-1.76-1-2.33-1.87-1.6-2.44-1.77-5.31-.78-6.83.7-1.09 1.8-1.73 2.84-1.73 1.05 0 1.71.57 2.58.57.84 0 1.36-.57 2.57-.57.93 0 1.93.51 2.63 1.38-2.31 1.27-1.94 4.57.37 5.41zM11.47 2.6c.44-.56.78-1.35.66-2.16-.71.05-1.55.5-2.04 1.08-.44.53-.82 1.33-.68 2.11.78.02 1.58-.44 2.06-1.03z" />
    </svg>
  );
}

export default function SocialAuthButtons({ callbackUrl = '/auth/role-select' }: SocialAuthButtonsProps) {
  const t = useTranslations('auth');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch {
      setError(t('social.oauthError'));
      setGoogleLoading(false);
    }
  }

  // Apple Sign-In placeholder — requires Apple Developer Program setup
  function handleApple() {
    setError('');
    // Apple Sign-In is not yet configured.
    // To enable: add APPLE_ID, APPLE_SECRET env vars and configure Apple provider.
    alert('Apple Sign-In coming soon');
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
      >
        <GoogleIcon />
        <span>{googleLoading ? '...' : t('social.continueWithGoogle')}</span>
      </button>

      <button
        type="button"
        onClick={handleApple}
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-900"
      >
        <AppleIcon />
        <span>{t('social.continueWithApple')}</span>
      </button>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
