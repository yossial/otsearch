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

      // Custom navy pin icon
      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;background:#001d3d;border:2px solid #ffc300;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.2)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      // Add markers for profiles with known city coords
      const locale = document.documentElement.lang?.split('-')[0] ?? 'he';

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
          .map((s) => `<span style="background:#fff8e1;color:#000814;padding:1px 6px;border-radius:3px;font-size:11px">${s}</span>`)
          .join(' ');

        const popup = `
          <div style="min-width:160px;font-family:system-ui,sans-serif">
            <p style="font-weight:600;margin:0 0 4px;font-size:13px;color:#000814">${name}</p>
            <p style="color:#001d3d;margin:0 0 6px;font-size:12px">${profile.location.city}</p>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">${specs}</div>
            <a href="/${locale}/therapist/${profile.slug}"
               style="display:block;text-align:center;background:#ffc300;color:#000814;padding:5px 8px;border-radius:4px;font-size:12px;font-weight:600;text-decoration:none">
              View Profile →
            </a>
          </div>
        `;

        L.marker(markerCoords, { icon: pinIcon })
          .bindPopup(popup)
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
