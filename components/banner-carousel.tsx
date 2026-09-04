"use client";

import { useEffect, useState } from "react";

export function BannerCarousel({ images }: { images: string[] }) {
  const [i, setI] = useState(0);
  const n = images.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) return null;

  return (
    <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:aspect-[16/6]">
      {images.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`Banner ${idx + 1}`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${idx === i ? "opacity-100" : "opacity-0"}`}
        />
      ))}

      {n > 1 && (
        <>
          <button
            aria-label="Previous"
            onClick={() => setI((v) => (v - 1 + n) % n)}
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            ‹
          </button>
          <button
            aria-label="Next"
            onClick={() => setI((v) => (v + 1) % n)}
            className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
