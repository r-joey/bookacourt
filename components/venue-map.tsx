"use client";

import { useEffect, useRef } from "react";
import type { Map as MLMap } from "maplibre-gl";
import { loadMaplibre } from "./maplibre-loader";

const STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function VenueMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaplibre().then((maplibregl) => {
      if (cancelled || !ref.current || mapRef.current) return;
      const map = new maplibregl.Map({
        container: ref.current,
        style: STYLE,
        center: [lng, lat],
        zoom: 15,
        attributionControl: { compact: true },
      });
      // OpenFreeMap's style references POI sprite icons that aren't in the
      // sprite sheet; supply a blank image so MapLibre stops warning.
      map.on("styleimagemissing", (e) => {
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      new maplibregl.Marker({ color: "#2563eb" }).setLngLat([lng, lat]).addTo(map);
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={ref} className="h-56 w-full overflow-hidden rounded-lg border border-slate-200" />;
}
