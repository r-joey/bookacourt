"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setActiveVenue } from "@/app/dashboard/actions";
import type { Venue } from "@/lib/supabase/database.types";

export function VenueSwitcher({
  venues,
  activeId,
  role,
}: {
  venues: Venue[];
  activeId?: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const active = venues.find((v) => v.id === activeId) ?? venues[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function choose(id: string) {
    setOpen(false);
    await setActiveVenue(id);
    router.refresh();
  }

  const initials = (active?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left hover:bg-slate-50"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-md bg-blue-50 text-xs font-bold text-[var(--color-brand)]">
          {active?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={active.logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{active?.name ?? "No venue"}</span>
          <span className="block text-xs capitalize text-slate-400">{role === "staff" ? "Staff" : "Owner"}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <p className="px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
            Your venues
          </p>
          {venues.map((v) => (
            <button
              key={v.id}
              onClick={() => choose(v.id)}
              className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
            >
              <span className="truncate">{v.name}</span>
              {v.id === active?.id && <span className="text-[var(--color-brand)]">✓</span>}
            </button>
          ))}
          {role !== "staff" && (
            <Link
              href="/dashboard/new-venue"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-md border-t border-slate-100 px-2 py-2 text-sm font-medium text-[var(--color-brand)] hover:bg-blue-50"
            >
              <span className="text-base leading-none">＋</span> Add venue
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
