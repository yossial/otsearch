'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

/**
 * Hero graphic: real photo with animated floating UI cards overlaid.
 * Pure decorative — aria-hidden.
 */
export default function HeroGraphic() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[340px] w-full max-w-[380px] select-none lg:h-[420px] lg:max-w-[460px]"
    >
      {/* ── Photo ──────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <Image
          src="/hero-1.png"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1024px) 0px, 460px"
        />
        {/* Bottom scrim for card legibility */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Ambient primary tint — top corner */}
        <div className="absolute -start-10 -top-10 h-[180px] w-[180px] rounded-full bg-primary opacity-[0.08] blur-[60px]" />
      </div>

      {/* ── Outer dashed ring (slow rotation) ──────────────────────────── */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[96%] w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/25"
      />

      {/* ── Card 1 — 200+ therapists (bottom-start, lowest) ────────────── */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 start-3 flex items-center gap-2 rounded-lg border border-white/30 bg-white/75 px-2.5 py-1.5 shadow-card backdrop-blur-sm"
      >
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-text-accent">
          200+
        </div>
        <span className="text-[10px] font-semibold text-text-secondary">מרפאים מוסמכים</span>
      </motion.div>

      {/* ── Card 2 — all health funds (bottom-start, middle) ───────────── */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute bottom-[4.5rem] start-3 flex items-center gap-2 rounded-lg border border-white/30 bg-white/75 px-2.5 py-1.5 shadow-card backdrop-blur-sm"
      >
        <div className="flex items-center gap-0.5">
          {['כ', 'מ', 'מ', 'ל'].map((letter, i) => (
            <span key={i} className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[8px] font-bold text-text-secondary">
              {letter}
            </span>
          ))}
        </div>
        <span className="text-[10px] font-semibold text-text-secondary">כל קופות החולים</span>
      </motion.div>

      {/* ── Card 3 — verified badge (bottom-start, top of cluster) ─────── */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-[7.5rem] start-3 flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/75 px-2.5 py-1.5 shadow-card backdrop-blur-sm"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-accent">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 12 11 14 15 10"/>
        </svg>
        <span className="text-[10px] font-semibold text-text-secondary">מוסמכים ומאומתים</span>
      </motion.div>

    </div>
  );
}
