'use client';

import { useEffect, useRef } from 'react';
import { CITY_COORDS, ISRAEL_CENTER } from '@/lib/gov/israel-city-coords';

interface NetworkMapProps {
  /** Count of active therapists per city name */
  cityStats: Record<string, number>;
  locale: string;
}

export default function NetworkMap({ cityStats, locale }: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if ((mapRef.current as unknown as Record<string, unknown>)._leaflet_id) return;

    void (async () => {
      const L = (await import('leaflet')).default;

      if (!document.querySelector('link[data-leaflet]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.setAttribute('data-leaflet', '1');
        document.head.appendChild(link);
      }

      const map = L.map(mapRef.current!, {
        center: ISRAEL_CENTER,
        zoom: 7,
        scrollWheelZoom: false,
        zoomControl: false,        // remove default zoom controls
        attributionControl: true,
      });
      mapInstanceRef.current = map;

      // ── CartoDB Positron — clean light tile layer ─────────────────────────
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" tabindex="-1">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" tabindex="-1">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);

      // ── Minimal zoom control (bottom-end corner, RTL-friendly) ────────────
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const maxCount = Math.max(...Object.values(cityStats), 1);

      // ── City markers ──────────────────────────────────────────────────────
      Object.entries(cityStats).forEach(([city, count]) => {
        const coords = CITY_COORDS[city];
        if (!coords) return;

        // Scale diameter 32–56px by count relative to max
        const ratio = count / maxCount;
        const size = Math.round(32 + ratio * 24);
        const half = size / 2;

        // Navy circle with white count
        const html = `
          <div class="net-marker" style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:rgba(0,0,128,0.9);
            border:2px solid rgba(0,0,128,0.4);
            display:flex;align-items:center;justify-content:center;
            color:#fff;font-size:${count >= 10 ? 12 : 13}px;font-weight:700;
            font-family:system-ui,sans-serif;
            box-shadow:0 0 0 4px rgba(0,0,128,0.15),0 2px 8px rgba(0,0,0,0.2);
            cursor:pointer;transition:transform 0.15s,box-shadow 0.15s;
          ">${count}</div>`;

        const icon = L.divIcon({
          className: '',
          html,
          iconSize: [size, size],
          iconAnchor: [half, half],
        });

        const tooltipText = `${city} · ${count}`;
        const marker = L.marker(coords, { icon })
          .bindTooltip(tooltipText, {
            permanent: false,
            direction: 'top',
            offset: [0, -(half + 4)],
            className: 'net-tooltip',
          })
          .addTo(map);

        // Navigate to search filtered by city on click
        marker.on('click', () => {
          window.location.href = `/${locale}/search?city=${encodeURIComponent(city)}`;
        });
      });
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
    <div className="relative">
      <div
        ref={mapRef}
        className="h-[400px] w-full overflow-hidden rounded-xl md:h-[480px]"
        aria-label="map"
      />
      {/* Custom tooltip + hover styles injected once */}
      <style>{`
        .net-tooltip {
          background: #fff !important;
          border: 1px solid rgba(0,0,128,0.2) !important;
          color: #00044a !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          padding: 4px 10px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important;
          white-space: nowrap !important;
        }
        .net-tooltip::before { display: none !important; }
        .net-marker:hover {
          transform: scale(1.15) !important;
          box-shadow: 0 0 0 6px rgba(0,0,128,0.2), 0 4px 12px rgba(0,0,0,0.2) !important;
        }
        .leaflet-control-attribution a { color: #888 !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.8) !important; color: #888 !important; }
        .leaflet-control-zoom a {
          background: #fff !important;
          color: #000080 !important;
          border-color: rgba(0,0,128,0.2) !important;
        }
        .leaflet-control-zoom a:hover { background: #f0f0ff !important; }
      `}</style>
    </div>
  );
}
