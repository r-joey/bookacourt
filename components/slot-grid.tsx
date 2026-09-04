"use client";

import { hourRange } from "@/lib/format";

export type GridCourt = { id: string; name: string; hourly_price: number; sport?: string };
export type CellStatus = "available" | "selected" | "pending" | "booked" | "unavailable";

export function slotKey(courtId: string, hour: number) {
  return `${courtId}:${hour}`;
}

export function SlotGrid({
  courts,
  hours,
  statusByKey,
  selected,
  onToggle,
  isPast,
}: {
  courts: GridCourt[];
  hours: number[];
  statusByKey: Record<string, "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired">;
  selected?: Set<string>;
  onToggle?: (key: string, court: GridCourt, hour: number) => void;
  isPast?: (hour: number) => boolean;
}) {
  function cellStatus(court: GridCourt, hour: number): CellStatus {
    const key = slotKey(court.id, hour);
    if (selected?.has(key)) return "selected";
    const s = statusByKey[key];
    if (s === "confirmed" || s === "completed") return "booked";
    if (s === "pending_payment") return "pending";
    if (isPast?.(hour)) return "unavailable";
    return "available";
  }

  const styles: Record<CellStatus, string> = {
    available: "bg-white hover:border-[var(--color-brand)] hover:bg-blue-50 cursor-pointer text-slate-600",
    selected: "bg-blue-100 border-[var(--color-brand)] text-[var(--color-brand)] font-semibold cursor-pointer",
    pending: "bg-amber-50 text-amber-500 cursor-not-allowed",
    booked: "bg-slate-100 text-slate-400 cursor-not-allowed",
    unavailable: "bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_6px,#e2e8f0_6px,#e2e8f0_12px)] text-transparent cursor-not-allowed",
  };

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[600px] gap-1.5"
        style={{ gridTemplateColumns: `132px repeat(${courts.length}, minmax(84px, 1fr))` }}
      >
        {/* header */}
        <div className="pb-1 pr-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Time</div>
        {courts.map((c) => (
          <div key={c.id} className="pb-1 text-center">
            <div className="truncate text-sm font-semibold">{c.name}</div>
            {c.sport && (
              <div className="mt-0.5">
                <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{c.sport}</span>
              </div>
            )}
          </div>
        ))}

        {/* rows */}
        {hours.map((hour) => (
          <FragmentRow key={hour}>
            <div className="flex items-center pr-2 text-xs text-slate-500 whitespace-nowrap">{hourRange(hour)}</div>
            {courts.map((court) => {
              const status = cellStatus(court, hour);
              const interactive = (status === "available" || status === "selected") && onToggle;
              return (
                <button
                  key={court.id + hour}
                  type="button"
                  disabled={!interactive}
                  onClick={() => interactive && onToggle!(slotKey(court.id, hour), court, hour)}
                  className={`h-12 rounded-md border border-slate-200 text-xs transition ${styles[status]}`}
                >
                  {status === "selected" ? "✓" : status === "available" ? `₱${court.hourly_price}` : ""}
                </button>
              );
            })}
          </FragmentRow>
        ))}
      </div>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function GridLegend() {
  const items: [string, string][] = [
    ["Available", "bg-white border border-slate-200"],
    ["Selected", "bg-blue-100 border border-[var(--color-brand)]"],
    ["Booked", "bg-slate-100"],
    ["Pending payment", "bg-amber-50"],
    ["Unavailable", "bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_4px,#e2e8f0_4px,#e2e8f0_8px)]"],
  ];
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-500">
      {items.map(([label, cls]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`h-3.5 w-3.5 rounded ${cls}`} /> {label}
        </span>
      ))}
    </div>
  );
}
