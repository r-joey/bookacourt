"use client";

import { useEffect, useRef } from "react";
import type { Map as MLMap, Marker as MLMarker, LngLat } from "maplibre-gl";
import { loadMaplibre } from "./maplibre-loader";

const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const DEFAULT: [number, number] = [121.0244, 14.5547]; // Metro Manila

export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const markerRef = useRef<MLMarker | null>(null);
  const emittedRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;
    loadMaplibre().then((maplibregl) => {
      if (cancelled || !ref.current || mapRef.current) return;
      const center: [number, number] = lat != null && lng != null ? [lng, lat] : DEFAULT;
      const map = new maplibregl.Map({
        container: ref.current,
        style: STYLE,
        center,
        zoom: lat != null ? 15 : 11,
        attributionControl: false,
      });
      map.on("styleimagemissing", (e) => {
        if (!map.hasImage(e.id)) {
          map.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;

      const marker = new maplibregl.Marker({ color: "#2563eb", draggable: true }).setLngLat(center).addTo(map);
      markerRef.current = marker;
      if (lat == null) marker.getElement().style.display = "none";

      const place = (ll: LngLat) => {
        marker.setLngLat(ll);
        marker.getElement().style.display = "block";
        const rLat = Number(ll.lat.toFixed(6));
        const rLng = Number(ll.lng.toFixed(6));
        emittedRef.current = `${rLat},${rLng}`;
        onChange(rLat, rLng);
      };
      map.on("click", (e) => place(e.lngLat));
      marker.on("dragend", () => place(marker.getLngLat()));
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to external changes (e.g. pasted Google Maps coordinates).
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || lat == null || lng == null) return;
    if (emittedRef.current === `${lat},${lng}`) return; // change came from the map itself
    marker.setLngLat([lng, lat]);
    marker.getElement().style.display = "block";
    map.flyTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 15) });
  }, [lat, lng]);

  return <div ref={ref} className="h-56 w-full overflow-hidden rounded-lg border border-slate-200" />;
}
