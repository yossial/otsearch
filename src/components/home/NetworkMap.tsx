'use client';

import { useEffect, useRef, useState } from 'react';
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

// Static map snapshot: central Tel Aviv, zoom 13
// Correct tile coords: lat=32.0853 lng=34.7818 → x≈4887 y≈3326
// 5×2 grid = 1280×512px — wide enough to fill any container
const STATIC_TILES = [
  { src: 'https://tile.openstreetmap.org/13/4885/3326.png', top: 0,   left: 0    },
  { src: 'https://tile.openstreetmap.org/13/4886/3326.png', top: 0,   left: 256  },
  { src: 'https://tile.openstreetmap.org/13/4887/3326.png', top: 0,   left: 512  },
  { src: 'https://tile.openstreetmap.org/13/4888/3326.png', top: 0,   left: 768  },
  { src: 'https://tile.openstreetmap.org/13/4889/3326.png', top: 0,   left: 1024 },
  { src: 'https://tile.openstreetmap.org/13/4885/3327.png', top: 256, left: 0    },
  { src: 'https://tile.openstreetmap.org/13/4886/3327.png', top: 256, left: 256  },
  { src: 'https://tile.openstreetmap.org/13/4887/3327.png', top: 256, left: 512  },
  { src: 'https://tile.openstreetmap.org/13/4888/3327.png', top: 256, left: 768  },
  { src: 'https://tile.openstreetmap.org/13/4889/3327.png', top: 256, left: 1024 },
];

// Fake pins with real face photos (pravatar.cc) — same pin style as real map markers
// left > 350 keeps pins off the Mediterranean Sea (west edge of tile grid)
const FAKE_PINS = [
  { top: 80,  left: 420,  photo: 'https://i.pravatar.cc/40?img=5'  },
  { top: 200, left: 580,  photo: 'https://i.pravatar.cc/40?img=11' },
  { top: 60,  left: 750,  photo: 'https://i.pravatar.cc/40?img=16' },
  { top: 310, left: 480,  photo: 'https://i.pravatar.cc/40?img=23' },
  { top: 150, left: 920,  photo: 'https://i.pravatar.cc/40?img=32' },
  { top: 390, left: 680,  photo: 'https://i.pravatar.cc/40?img=44' },
  { top: 100, left: 1080, photo: 'https://i.pravatar.cc/40?img=47' },
  { top: 280, left: 820,  photo: 'https://i.pravatar.cc/40?img=9'  },
  { top: 420, left: 1000, photo: 'https://i.pravatar.cc/40?img=26' },
];

export default function NetworkMap({ profiles, locale }: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MaplibreMap | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // ── Start geolocation immediately — in parallel with map lib load ────────
    const locationPromise = requestLocation();

    void (async () => {
      const maplibregl = (await import('maplibre-gl')).default;

      // Enable RTL text rendering (Hebrew / Arabic map labels)
      if (!maplibregl.getRTLTextPluginStatus || maplibregl.getRTLTextPluginStatus() === 'unavailable') {
        maplibregl.setRTLTextPlugin(
          'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
          true, // lazy-load
        );
      }

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
        minZoom: 6,
        maxZoom: 16,
        // Constrain panning to Israel + immediate neighbours
        maxBounds: [[29, 25], [42, 36]],
        scrollZoom: false,
        attributionControl: { compact: true },
      });
      mapInstanceRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      // Safety net: if map takes > 12s to load, reveal it anyway
      loadTimeoutRef.current = setTimeout(() => setMapLoaded(true), 12_000);

      // ── Wait for map load AND geolocation in parallel ─────────────────────
      // Register the 'load' listener immediately so we never miss the event.
      const [userLatLng] = await Promise.all([
        locationPromise,
        new Promise<void>((resolve) => map.once('load', resolve)),
      ]);

      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      setMapLoaded(true);

      // Fly to nearest therapist (or fallback city)
      const flyToTarget = () => {
        let targetLat: number;
        let targetLng: number;

        if (userLatLng) {
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

        map.flyTo({ center: [targetLng, targetLat], zoom: 9, duration: 1800, essential: true });
      };

      flyToTarget();

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: [0, -48],
        className: 'net-popup',
        maxWidth: '220px',
      });

      const jitter = () => (Math.random() - 0.5) * 0.018;
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
    })();

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      {/* Static map placeholder — fades out once the real map loads */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-xl transition-opacity duration-700"
        style={{ opacity: mapLoaded ? 0 : 1 }}
      >
        {/* Stitched OSM tiles — Tel Aviv zoom 13 */}
        <div className="relative h-full w-full bg-[#e8e0d8]">
          <div className="absolute inset-0" style={{ overflow: 'hidden' }}>
            {STATIC_TILES.map((t) => (
              <img
                key={t.src}
                src={t.src}
                alt=""
                width={256}
                height={256}
                className="absolute"
                style={{ top: t.top, left: t.left, width: 256, height: 256 }}
              />
            ))}
          </div>

          {/* Fake avatar pins — same style as real map markers */}
          {FAKE_PINS.map((pin, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center"
              style={{
                top: pin.top, left: pin.left,
                transform: 'translate(-50%, -100%)',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pin.photo}
                alt=""
                width={36}
                height={36}
                style={{ width: 36, height: 36, borderRadius: '50%', border: '2.5px solid #000080', objectFit: 'cover', display: 'block' }}
              />
              <div style={{ width: 2.5, height: 10, background: '#000080', borderRadius: '0 0 2px 2px' }} />
            </div>
          ))}
        </div>
      </div>

      <div
        ref={mapRef}
        className="h-[400px] w-full overflow-hidden rounded-xl md:h-[480px]"
        aria-label="map"
      />

      {/* Recenter button — visible once map has loaded */}
      {mapLoaded && (
        <button
          onClick={() => mapInstanceRef.current?.flyTo({ center: [ISRAEL_CENTER[1], ISRAEL_CENTER[0]], zoom: 7.5, duration: 800 })}
          className="absolute bottom-12 left-3 z-20 flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
          title="Recenter on Israel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          ישראל
        </button>
      )}
      <style>{`
        .net-avatar-pin {
          display: flex; flex-direction: column; align-items: center;
          cursor: pointer;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.25));
          /* NO transition on transform — MapLibre uses transform for positioning;
             any transition here causes lag/stuttering during map drag */
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
