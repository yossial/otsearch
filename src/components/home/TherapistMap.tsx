'use client';

import { useEffect, useRef } from 'react';
import type { TherapistProfilePublic } from '@/types';
import { CITY_COORDS, ISRAEL_CENTER } from '@/lib/gov/israel-city-coords';

// Leaflet is imported dynamically to avoid SSR issues
// This component should only be loaded with next/dynamic + ssr: false

interface TherapistMapProps {
  profiles: TherapistProfilePublic[];
  activeCity?: string;
}

export default function TherapistMap({ profiles, activeCity }: TherapistMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import to avoid SSR
    void (async () => {
      const L = (await import('leaflet')).default;

      // Inject Leaflet CSS if not already present
      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet', '1');
        document.head.appendChild(link);
      }

      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Determine initial center
      const activeCityCoords = activeCity ? CITY_COORDS[activeCity] : undefined;
      const centerCoords: [number, number] = activeCityCoords ?? ISRAEL_CENTER;
      const initialZoom = activeCityCoords ? 11 : 8;

      // Guard against React StrictMode double-invocation leaving a stale leaflet container
      if ((mapRef.current as unknown as Record<string, unknown>)._leaflet_id) return;

      const map = L.map(mapRef.current!, {
        center: centerCoords,
        zoom: initialZoom,
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      // Custom teardrop pin icon
      const pinHtml = `
        <div style="position:relative;width:28px;height:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))">
          <svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#001d3d"/>
            <circle cx="14" cy="13" r="6" fill="#ffc300"/>
          </svg>
        </div>`;
      const pinIcon = L.divIcon({
        className: '',
        html: pinHtml,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
        popupAnchor: [0, -38],
      });

      // Add markers for profiles with known city coords
      const locale = document.documentElement.lang?.split('-')[0] ?? 'he';

      const viewProfileLabel: Record<string, string> = {
        he: 'לפרופיל המלא ←',
        ar: 'عرض الملف الكامل ←',
        en: 'View full profile →',
        ru: 'Открыть профиль →',
      };
      const acceptingLabel: Record<string, string> = {
        he: 'מקבל/ת מטופלים',
        ar: 'يقبل مرضى جدد',
        en: 'Accepting patients',
        ru: 'Принимает пациентов',
      };

      profiles.forEach((profile) => {
        const coords = CITY_COORDS[profile.location.city];
        if (!coords) return;

        // Jitter slightly to avoid stacking
        const jitter = (): number => (Math.random() - 0.5) * 0.005;
        const markerCoords: [number, number] = [coords[0] + jitter(), coords[1] + jitter()];

        const name =
          profile.displayName[locale as keyof typeof profile.displayName] ??
          profile.displayName.he;

        const specs = profile.specialisations
          .slice(0, 2)
          .map((s) => `<span style="background:#f0f4ff;color:#001d3d;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:500">${s}</span>`)
          .join(' ');

        const feeStr = profile.feeRange?.min
          ? `<span style="color:#001d3d;font-size:11px">₪${profile.feeRange.min}+</span>`
          : '';

        const acceptingStr = profile.isAcceptingPatients
          ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#16a34a"><span style="width:6px;height:6px;border-radius:50%;background:#16a34a;display:inline-block"></span>${acceptingLabel[locale] ?? acceptingLabel.en}</span>`
          : '';

        const popup = `
          <div style="min-width:180px;max-width:220px;font-family:system-ui,sans-serif;padding:2px">
            <p style="font-weight:700;margin:0 0 2px;font-size:13px;color:#000814">${name}</p>
            <p style="color:#64748b;margin:0 0 8px;font-size:12px;display:flex;align-items:center;gap:4px">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${profile.location.city}
            </p>
            ${specs ? `<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">${specs}</div>` : ''}
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
              ${acceptingStr}
              ${feeStr}
            </div>
            <a href="/${locale}/therapist/${profile.slug}"
               style="display:block;text-align:center;background:#001d3d;color:#ffc300;padding:7px 10px;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none">
              ${viewProfileLabel[locale] ?? viewProfileLabel.en}
            </a>
          </div>
        `;

        L.marker(markerCoords, { icon: pinIcon })
          .bindPopup(popup, { maxWidth: 240 })
          .addTo(map);
      });

      // Geolocation: zoom to user if permitted
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          ({ coords: pos }) => {
            map.setView([pos.latitude, pos.longitude], 11);
          },
          () => {},
          { timeout: 5000 }
        );
      }
    })();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={mapRef}
      className="h-[400px] w-full md:h-[480px] rounded-lg overflow-hidden border border-border"
      aria-label="Map of therapists"
    />
  );
}
