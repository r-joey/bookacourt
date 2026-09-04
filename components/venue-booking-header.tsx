"use client";

import Link from "next/link";
import { useState } from "react";
import { SPORT_EMOJI } from "@/lib/constants";

export function VenueBookingHeader({
  slug,
  name,
  logoUrl,
  sport,
}: {
  slug: string;
  name: string;
  logoUrl: string | null;
  sport: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyHandle() {
    const handle = `@${slug}`;
    try {
      await navigator.clipboard.writeText(handle);
    } catch {
      // Fallback for browsers without the async clipboard API
      const el = document.createElement("textarea");
      el.value = handle;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      try { document.execCommand("copy"); } catch {}
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mb-6 flex items-start gap-3">
      <Link
        href={`/@${slug}`}
        className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-50 text-xl"
        aria-label={`${name} venue page`}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          SPORT_EMOJI[sport] ?? "🏟️"
        )}
      </Link>
      <div className="min-w-0">
        <Link href={`/@${slug}`} className="block text-xl font-bold tracking-tight hover:underline">
          {name}
        </Link>
        <button
          type="button"
          onClick={copyHandle}
          title="Copy handle"
          className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-[var(--color-brand)]"
        >
          <span className="font-mono">@{slug}</span>
          {copied ? (
            <span className="text-xs font-medium text-emerald-600">Copied!</span>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
