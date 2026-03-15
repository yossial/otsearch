'use client';

import { useState, useEffect, useRef } from 'react';
import type { IsraelCity } from '@/lib/gov/govApi';

interface CitySelectProps {
  value: string;
  onChange: (name: string, code: number) => void;
  placeholder?: string;
  required?: boolean;
}

export default function CitySelect({ value, onChange, placeholder = 'חפש עיר...', required }: CitySelectProps) {
  const [cities, setCities] = useState<IsraelCity[]>([]);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load cities on mount
  useEffect(() => {
    fetch('/api/cities?onlyCities=true')
      .then((r) => r.json())
      .then((data: { cities?: IsraelCity[] }) => setCities(data.cities ?? []))
      .catch(() => {});
  }, []);

  // Sync query when value changes from outside
  useEffect(() => {
    setQuery(value);
  }, [value]);

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
    ? cities.filter((c) => c.name.includes(query) || c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 30)
    : [];

  function select(city: IsraelCity) {
    setQuery(city.name);
    onChange(city.name, city.code);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        id="city"
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.length >= 1 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        dir="rtl"
        autoComplete="off"
        className="form-field w-full"
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          dir="rtl"
          className="absolute z-dropdown mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-dropdown"
        >
          {filtered.map((city) => (
            <li
              key={city.code}
              role="option"
              aria-selected={city.name === value}
              onMouseDown={() => select(city)}
              className="px-3.5 py-2 text-sm text-text-primary hover:bg-primary-xlight hover:text-primary"
            >
              {city.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
