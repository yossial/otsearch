'use client';

import { useEffect, useRef } from 'react';
import { CITY_COORDS, ISRAEL_CENTER } from '@/lib/gov/israel-city-coords';
import type { Map as MaplibreMap } from 'maplibre-gl';

interface NetworkMapProps {
  cityStats: Record<string, number>;
  locale: string;
}

export default function NetworkMap({ cityStats, locale }: NetworkMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MaplibreMap | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    void (async () => {
      const maplibregl = (await import('maplibre-gl')).default;

      // Inject MapLibre CSS once
      if (!document.querySelector('link[data-maplibre]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/maplibre-gl/dist/maplibre-gl.css';
        link.setAttribute('data-maplibre', '1');
        document.head.appendChild(link);
      }

      const map = new maplibregl.Map({
        container: mapRef.current!,
        // OpenFreeMap — free, no API key, vector tiles
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [ISRAEL_CENTER[1], ISRAEL_CENTER[0]], // MapLibre: [lng, lat]
        zoom: 6.8,
        scrollZoom: false,
        attributionControl: { compact: true },
      });
      mapInstanceRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

      map.on('load', () => {
        const maxCount = Math.max(...Object.values(cityStats), 1);

        // Build GeoJSON from city stats
        const features = Object.entries(cityStats)
          .map(([city, count]) => {
            const coords = CITY_COORDS[city];
            if (!coords) return null;
            return {
              type: 'Feature' as const,
              properties: { city, count, ratio: count / maxCount },
              geometry: { type: 'Point' as const, coordinates: [coords[1], coords[0]] },
            };
          })
          .filter(Boolean);

        map.addSource('cities', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: features as GeoJSON.Feature[] },
        });

        // Circle layer — radius scales with count
        map.addLayer({
          id: 'city-circles',
          type: 'circle',
          source: 'cities',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['get', 'ratio'], 0, 10, 1, 22],
            'circle-color': '#000080',
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(0,0,128,0.3)',
          },
        });

        // Count label layer
        map.addLayer({
          id: 'city-labels',
          type: 'symbol',
          source: 'cities',
          layout: {
            'text-field': ['to-string', ['get', 'count']],
            'text-size': 11,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#ffffff',
          },
        });

        // Click → search by city
        map.on('click', 'city-circles', (e) => {
          const city = e.features?.[0]?.properties?.city as string | undefined;
          if (city) window.location.href = `/${locale}/search?city=${encodeURIComponent(city)}`;
        });

        // Cursor
        map.on('mouseenter', 'city-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'city-circles', () => { map.getCanvas().style.cursor = ''; });

        // Tooltip popup
        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: 'net-popup' });
        map.on('mouseenter', 'city-circles', (e) => {
          const props = e.features?.[0]?.properties;
          if (!props || !e.lngLat) return;
          popup.setLngLat(e.lngLat).setHTML(`<span>${props.city as string} · ${props.count as number}</span>`).addTo(map);
        });
        map.on('mouseleave', 'city-circles', () => popup.remove());
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
        .net-popup .maplibregl-popup-content {
          background: #fff;
          border: 1px solid rgba(0,0,128,0.2);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #00044a;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          white-space: nowrap;
        }
        .net-popup .maplibregl-popup-tip { display: none; }
        .maplibregl-ctrl-attrib { font-size: 10px !important; }
        .maplibregl-ctrl-zoom-in,
        .maplibregl-ctrl-zoom-out {
          background-color: #fff !important;
          color: #000080 !important;
        }
      `}</style>
    </div>
  );
}
