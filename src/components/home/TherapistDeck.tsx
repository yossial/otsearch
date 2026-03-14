'use client';

import { useState } from 'react';
import type { TherapistProfilePublic } from '@/types';
import TherapistCard from '@/components/search/TherapistCard';

const CARD_W         = 190;
const OVERLAP        = 82;  // default overlap (negative margin)
const HOVER_OVERLAP  = 20;  // reduced overlap on hovered card → pushes right neighbours out

interface Props {
  profiles: TherapistProfilePublic[];
}

export default function TherapistDeck({ profiles }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cards = profiles.slice(0, 9);
  const n     = cards.length;

  return (
    // mask-image fades both edges — no hard clip, works with translateY lifts too
    <div
      className="relative w-full"
      style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 82%, transparent 100%)' }}
    >

      <div
        className="flex items-end justify-center px-4 py-6"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {cards.map((profile, idx) => {
          const isHov = hoveredIdx === idx;

          // Last 2 cards fade to reinforce the "more beyond" hint
          const opacity = isHov
            ? 1
            : idx >= n - 2
              ? Math.max(0.35, 1 - (idx - (n - 3)) * 0.32)
              : hoveredIdx !== null
                ? 0.82
                : 1;

          return (
            <div
              key={profile.id}
              className="relative flex-shrink-0"
              style={{
                width:           `${CARD_W}px`,
                // Hovered card gets a wider right margin → pushes right neighbours apart.
                // The hovered card itself never moves left — pointer stays on it.
                // z-index:50 raises it above the left neighbour, revealing its hidden left side.
                marginInlineEnd: idx < n - 1 ? `${-(isHov ? HOVER_OVERLAP : OVERLAP)}px` : '0',
                zIndex:          isHov ? 50 : n - idx,
                opacity,
                transform:       isHov
                  ? 'translateY(-14px) scale(1.04)'
                  : 'translateY(0) scale(1)',
                filter:          isHov
                  ? 'drop-shadow(0 18px 32px var(--color-primary-glow))'
                  : 'none',
                transition:      [
                  'margin-inline-end 0.55s cubic-bezier(0.34,1.1,0.64,1)',
                  'transform 0.45s cubic-bezier(0.34,1.4,0.64,1)',
                  'opacity 0.35s ease',
                  'filter 0.35s ease',
                ].join(', '),
                cursor:          'pointer',
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
            >
              <TherapistCard therapist={profile} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
