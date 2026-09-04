"use client";

// Load MapLibre GL from a CDN (UMD build) instead of bundling the npm ESM
// package. The npm build spawns a `{type:"module"}` web worker off
// import.meta.url, which Turbopack mis-serves in dev (worker import resolves to
// an HTML page → "non-JavaScript MIME type"). The CDN UMD build bundles its
// worker as a blob, so it works everywhere.

type Maplibre = typeof import("maplibre-gl");

const VERSION = "5.24.0";
const JS = `https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/${VERSION}/maplibre-gl.js`;
const CSS = `https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/${VERSION}/maplibre-gl.css`;

let promise: Promise<Maplibre> | null = null;

// OpenFreeMap's "liberty" style references POI sprite icons (office,
// swimming_pool, etc.) that aren't in its sprite sheet. MapLibre logs a warn
// for each on every tile — harmless but very noisy. Drop just those.
function silenceMissingImageWarnings() {
  const w = console.warn as typeof console.warn & { __mlPatched?: boolean };
  if (w.__mlPatched) return;
  const patched = (...args: unknown[]) => {
    const first = args[0];
    if (typeof first === "string" && /^Image ".*" could not be loaded/.test(first)) return;
    w(...(args as Parameters<typeof console.warn>));
  };
  (patched as typeof patched & { __mlPatched?: boolean }).__mlPatched = true;
  console.warn = patched;
}

export function loadMaplibre(): Promise<Maplibre> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  silenceMissingImageWarnings();
  const existing = (window as unknown as { maplibregl?: Maplibre }).maplibregl;
  if (existing) return Promise.resolve(existing);
  if (promise) return promise;

  promise = new Promise<Maplibre>((resolve, reject) => {
    if (!document.getElementById("maplibre-css")) {
      const link = document.createElement("link");
      link.id = "maplibre-css";
      link.rel = "stylesheet";
      link.href = CSS;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = JS;
    script.async = true;
    script.onload = () => {
      const gl = (window as unknown as { maplibregl?: Maplibre }).maplibregl;
      if (gl) resolve(gl);
      else reject(new Error("maplibre-gl failed to initialise"));
    };
    script.onerror = () => reject(new Error("failed to load maplibre-gl"));
    document.head.appendChild(script);
  });
  return promise;
}
