'use client';

import { Street } from '@/lib/gov/govApi';
import { useState, useEffect, useRef } from 'react';

interface StreetSelectProps {
  cityCode: number;
  value: string;
  onChange: (street: string) => void;
  placeholder?: string;
}

export default function StreetSelect({ cityCode, value, onChange, placeholder = 'חפש רחוב...' }: StreetSelectProps) {
  const [streets, setStreets] = useState<Street[]>([]);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load streets when cityCode changes
  useEffect(() => {
    if (!cityCode) return;

    let cancelled = false;
    fetch(`/api/streets?cityCode=${cityCode}`)
      .then((r) => r.json())
      .then((data: { streets?: Street[] }) => {
        if (!cancelled) {
          setStreets(data.streets ?? []);
          setQuery('');
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [cityCode]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = query.length >= 1
    ? streets
        .filter((s) => 
          s.name.includes(query) || 
          s.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 30)
    : [];

  function select(street: string) {
    setQuery(street);
    onChange(street);
    setOpen(false);
  }

  if (!cityCode) return null;

  return (
    <div ref={containerRef} className="relative">
      <input
        id="street"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.length >= 1 && setOpen(true)}
        placeholder={streets.length === 0 ? 'טוען רחובות...' : placeholder}
        dir="rtl"
        autoComplete="off"
        className="w-full rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          dir="rtl"
          className="absolute z-dropdown mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-dropdown"
        >
          {filtered.map((street) => (
            <li
              key={`${street.name}-${street.cityCode}`}
              role="option"
              aria-selected={street.name === value}
              onMouseDown={() => select(street.name)}
              className="px-3.5 py-2 text-sm text-text-primary hover:bg-primary-xlight hover:text-primary"
            >
              {street.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
