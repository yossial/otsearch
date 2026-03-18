'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpStatProps {
  value: number;
  suffix?: string;
  label: string;
  duration?: number; // ms
}

export default function CountUpStat({ value, suffix = '', label, duration = 1800 }: CountUpStatProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();

          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1 text-center">
      <span className="font-display text-5xl font-extrabold leading-none tracking-tight text-white lg:text-6xl">
        {display.toLocaleString()}{suffix}
      </span>
      <span className="mt-1 text-sm font-normal text-white/50 lg:text-base">{label}</span>
    </div>
  );
}
