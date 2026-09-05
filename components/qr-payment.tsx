"use client";

import { useEffect, useState } from "react";

/**
 * Payment QR thumbnail with tap-to-enlarge and download.
 * Used on the customer booking Pay step and the tenant invoice Pay panel.
 */
export function QrPayment({ url, label }: { url: string; label?: string }) {
  const [enlarged, setEnlarged] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const alt = label ? `${label} payment QR` : "Payment QR";

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setEnlarged(false); }
    if (enlarged) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enlarged]);

  async function download() {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      const ext = (blob.type.split("/")[1] || "png").split("+")[0];
      a.download = `${(label || "payment-qr").toLowerCase().replace(/\s+/g, "-")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      // Fallback (e.g. CORS): open the image so the viewer can save it manually.
      window.open(url, "_blank", "noopener");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={() => setEnlarged(true)}
        className="block rounded-lg border border-slate-200 bg-white p-1 transition hover:border-[var(--color-brand)]"
        aria-label="Enlarge payment QR"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="h-40 w-40 object-contain" />
      </button>
      <div className="mt-1.5 flex justify-center gap-4 text-xs">
        <button type="button" onClick={() => setEnlarged(true)} className="font-medium text-[var(--color-brand)] hover:underline">
          Enlarge
        </button>
        <button type="button" onClick={download} disabled={downloading} className="font-medium text-[var(--color-brand)] hover:underline disabled:opacity-50">
          {downloading ? "Saving…" : "Download"}
        </button>
      </div>

      {enlarged && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4"
          onClick={() => setEnlarged(false)}
          role="dialog"
          aria-modal="true"
          aria-label={alt}
        >
          <div className="flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={alt} className="max-h-[80vh] max-w-[90vw] rounded-lg bg-white p-3" />
            <div className="flex gap-2">
              <button type="button" onClick={download} disabled={downloading} className="btn-primary btn-sm">
                {downloading ? "Saving…" : "Download QR"}
              </button>
              <button type="button" onClick={() => setEnlarged(false)} className="btn-ghost btn-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
