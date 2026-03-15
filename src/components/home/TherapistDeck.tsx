'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { TherapistProfilePublic } from '@/types';

const MAX_VISIBLE = 8;
const CIRCLE_SIZE = 52;
const OVERLAP = 16;

interface Props {
  profiles: TherapistProfilePublic[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function TherapistDeck({ profiles }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const t = useTranslations('home.therapistPreview');
  const locale = useLocale();

  const getName = (p: TherapistProfilePublic): string => {
    const key = locale as keyof typeof p.displayName;
    return p.displayName[key] || p.displayName.he || '';
  };

  const visible = profiles.slice(0, MAX_VISIBLE);
  const remaining = Math.max(0, profiles.length - MAX_VISIBLE);

  return (
    <div
      className="relative flex items-end justify-center py-6"
      style={{ paddingInlineStart: `${OVERLAP}px` }}
      onMouseLeave={() => setHoveredIdx(null)}
    >
      {visible.map((profile, idx) => {
        const isHov = hoveredIdx === idx;
        const name = getName(profile);
        const initials = getInitials(name);
        const city = profile.location.city;
        const spec = profile.specialisations[0] ?? null;

        return (
          <div
            key={profile.id}
            className="relative flex-shrink-0"
            style={{
              marginInlineStart: idx === 0 ? '0' : `-${OVERLAP}px`,
              zIndex: isHov ? 50 : MAX_VISIBLE - idx,
              transition: 'transform 0.28s cubic-bezier(0.34,1.4,0.64,1)',
              transform: isHov ? 'translateY(-10px) scale(1.1)' : 'translateY(0) scale(1)',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
          >
            {/* Avatar circle */}
            <div
              className="rounded-full ring-2 ring-white overflow-hidden flex items-center justify-center bg-primary text-white text-xs font-semibold select-none"
              style={{ width: `${CIRCLE_SIZE}px`, height: `${CIRCLE_SIZE}px` }}
            >
              {profile.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo}
                  alt={name}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Hover popover */}
            {isHov && (
              <div
                className="absolute left-1/2 bg-white rounded-xl border border-border shadow-dropdown w-44 p-3"
                style={{
                  bottom: '100%',
                  transform: 'translateX(-50%)',
                  marginBottom: '12px',
                  zIndex: 50,
                  pointerEvents: 'none',
                }}
              >
                {/* Card content */}
                <p className="text-sm font-normal text-text-primary leading-tight truncate">{name}</p>

                {/* Spec · City line */}
                {(spec || city) && (
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    {spec && city ? `${spec} · ${city}` : spec ?? city}
                  </p>
                )}

                {/* Rating */}
                {profile.ratingCount > 0 && (
                  <p className="text-xs text-amber-500 mt-0.5">
                    ★ {profile.ratingAvg.toFixed(1)}
                  </p>
                )}

                {/* View profile link — re-enable pointer events for the link */}
                <Link
                  href={`/therapist/${profile.slug}`}
                  className="text-xs text-accent hover:underline block text-center mt-2"
                  style={{ pointerEvents: 'auto' }}
                >
                  {t('viewProfile')}
                </Link>

                {/* Downward arrow */}
                <div
                  aria-hidden="true"
                  className="absolute bg-white border-b border-r border-border"
                  style={{
                    width: '10px',
                    height: '10px',
                    bottom: '-6px',
                    left: '50%',
                    transform: 'translateX(-50%) rotate(45deg)',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* +N overflow circle */}
      {remaining > 0 && (
        <Link
          href="/search"
          className="relative flex-shrink-0 rounded-full ring-2 ring-white flex items-center justify-center bg-primary-light text-primary text-xs font-semibold select-none hover:opacity-90 transition-opacity"
          style={{
            width: `${CIRCLE_SIZE}px`,
            height: `${CIRCLE_SIZE}px`,
            marginInlineStart: `-${OVERLAP}px`,
            zIndex: 0,
          }}
        >
          +{remaining}
        </Link>
      )}
    </div>
  );
}
