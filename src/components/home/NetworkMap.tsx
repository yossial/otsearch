'use client';

import { useEffect, useRef } from 'react';
import { ISRAEL_CENTER } from '@/lib/gov/israel-city-coords';
import type { Map as MaplibreMap } from 'maplibre-gl';
import type { TherapistProfilePublic } from '@/types';

interface NetworkMapProps {
  profiles: TherapistProfilePublic[];
  locale: string;
}

function distKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
    Math.cos((b[0] * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Request geolocation immediately — returns a promise so we can await it
// alongside map initialisation
function requestLocation(): Promise<[number, number] | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve([coords.latitude, coords.longitude]),
      () => resolve(null),
      { timeout: 6000, maximumAge: 120_000 },
    );
  });
}

const FALLBACK_CENTERS: [number, number][] = [
  [32.0853, 34.7818], // Tel Aviv
  [31.7683, 35.2137], // Jerusalem
  [32.7940, 34.9896], // Haifa
  [31.2518, 34.7913], // Beer Sheva
];

function makeAvatarEl(photo: string | null, name: string): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'net-avatar-pin';
  wrapper.title = name;

  const img = document.createElement('img');
  img.src = photo ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=000080&color=fff&size=40`;
  img.alt = name;
  img.width = 36;
  img.height = 36;

  const stem = document.createElement('div');
  stem.className = 'net-avatar-stem';

  wrapper.appendChild(img);
  wrapper.appendChild(stem);
  return wrapper;
}

export default function NetworkMap({ profiles, locale }: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MaplibreMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // ── Start geolocation immediately — in parallel with map lib load ────────
    const locationPromise = requestLocation();

    void (async () => {
      const maplibregl = (await import('maplibre-gl')).default;

      if (!document.querySelector('link[data-maplibre]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl/dist/maplibre-gl.css';
        link.setAttribute('data-maplibre', '1');
        document.head.appendChild(link);
      }

      const map = new maplibregl.Map({
        container: mapRef.current!,
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [ISRAEL_CENTER[1], ISRAEL_CENTER[0]],
        zoom: 7,
        scrollZoom: false,
        attributionControl: { compact: true },
      });
      mapInstanceRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      // ── Await location result and fly once map is ready ───────────────────
      const userLatLng = await locationPromise;

      const flyToTarget = () => {
        let targetLat: number;
        let targetLng: number;

        if (userLatLng) {
          // Find nearest therapist to user
          let minDist = Infinity;
          let nearest: [number, number] | null = null;
          for (const p of profiles) {
            const [lng, lat] = p.location.coordinates;
            if (!lng || !lat) continue;
            const d = distKm(userLatLng, [lat, lng]);
            if (d < minDist) { minDist = d; nearest = [lat, lng]; }
          }
          if (nearest) { [targetLat, targetLng] = nearest; }
          else { [targetLat, targetLng] = userLatLng; }
        } else {
          const fb = FALLBACK_CENTERS[Math.floor(Math.random() * FALLBACK_CENTERS.length)]!;
          [targetLat, targetLng] = fb;
        }

        map.flyTo({ center: [targetLng, targetLat], zoom: 10.5, duration: 1800, essential: true });
      };

      // Fly after map loads (tiles ready)
      map.on('load', () => {
        flyToTarget();

        const popup = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: [0, -48],
          className: 'net-popup',
          maxWidth: '220px',
        });

        const jitter = () => (Math.random() - 0.5) * 0.004;
        const isRtl = locale === 'he' || locale === 'ar';

        profiles.forEach((p) => {
          const [lng, lat] = p.location.coordinates;
          if (!lng || !lat) return;

          const name = p.displayName[locale as keyof typeof p.displayName] ?? p.displayName.he;
          const specs = p.specialisations.slice(0, 2).join(' · ');

          const el = makeAvatarEl(p.photo, name);

          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([lng + jitter(), lat + jitter()])
            .addTo(map);

          el.addEventListener('mouseenter', () => {
            popup
              .setLngLat(marker.getLngLat())
              .setHTML(
                `<div class="net-popup-inner"${isRtl ? ' dir="rtl"' : ''}>
                  <p class="net-popup-name">${name}</p>
                  ${p.location.city ? `<p class="net-popup-city">${p.location.city}</p>` : ''}
                  ${specs ? `<p class="net-popup-specs">${specs}</p>` : ''}
                </div>`
              )
              .addTo(map);
            el.classList.add('net-avatar-pin--hover');
          });

          el.addEventListener('mouseleave', () => {
            popup.remove();
            el.classList.remove('net-avatar-pin--hover');
          });

          el.addEventListener('click', () => {
            window.location.href = `/${locale}/therapist/${p.slug}`;
          });
        });
      });
    })();

    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
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
      <style>{`
        .net-avatar-pin {
          display: flex; flex-direction: column; align-items: center;
          cursor: pointer;
          transition: transform 0.15s;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
        }
        .net-avatar-pin img {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2.5px solid #000080;
          object-fit: cover;
          display: block;
        }
        .net-avatar-stem {
          width: 2.5px; height: 10px;
          background: #000080;
          border-radius: 0 0 2px 2px;
        }
        .net-avatar-pin--hover {
          transform: scale(1.15);
          filter: drop-shadow(0 4px 10px rgba(0,0,128,0.4));
        }
        .net-popup .maplibregl-popup-content {
          background: #fff;
          border: 1px solid rgba(0,0,128,0.12);
          border-radius: 8px;
          padding: 8px 12px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }
        .net-popup .maplibregl-popup-tip { display: none; }
        .net-popup-name { font-size: 13px; font-weight: 700; color: #111827; margin: 0 0 2px; }
        .net-popup-city { font-size: 11px; color: #6b7280; margin: 0 0 3px; }
        .net-popup-specs { font-size: 11px; color: #4b5563; margin: 0; }
        .maplibregl-ctrl-attrib { font-size: 10px !important; }
        .maplibregl-ctrl-zoom-in, .maplibregl-ctrl-zoom-out {
          background-color: #fff !important; color: #000080 !important;
        }
        .maplibregl-ctrl-group {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          border-radius: 6px !important; overflow: hidden;
        }
      `}</style>
    </div>
  );
}
