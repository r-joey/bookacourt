"use client";

import { hourRange } from "@/lib/format";
import { slotKey, type GridCourt } from "@/components/slot-grid";

export type SlotCell = {
  booking_id: string;
  booking_code: string;
  customer_name: string;
  status: "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired";
  source: string;
};

const cellStyle: Record<string, string> = {
  pending_payment: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-400",
  completed: "border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300",
};

const statusWord: Record<string, string> = {
  pending_payment: "Pending",
  confirmed: "Confirmed",
  completed: "Done",
};

function firstName(name: string) {
  return (name || "—").trim().split(/\s+/)[0];
}

export function DayBoard({
  courts,
  hours,
  cellsByKey,
  isPast,
  onOccupiedClick,
  onEmptyClick,
}: {
  courts: GridCourt[];
  hours: number[];
  cellsByKey: Record<string, SlotCell>;
  isPast: (hour: number) => boolean;
  onOccupiedClick: (bookingId: string) => void;
  onEmptyClick: (courtId: string, hour: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-[600px] gap-1.5"
        style={{ gridTemplateColumns: `132px repeat(${courts.length}, minmax(92px, 1fr))` }}
      >
        {/* header */}
        <div className="sticky left-0 z-10 bg-white pb-1 pr-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 shadow-[4px_0_5px_-3px_rgba(15,23,42,0.12)]">Time</div>
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
          <div key={hour} className="contents">
            <div className="sticky left-0 z-10 flex items-center bg-white pr-2 text-xs text-slate-500 whitespace-nowrap shadow-[4px_0_5px_-3px_rgba(15,23,42,0.12)]">{hourRange(hour)}</div>
            {courts.map((court) => {
              const cell = cellsByKey[slotKey(court.id, hour)];
              if (cell) {
                return (
                  <button
                    key={court.id + hour}
                    type="button"
                    onClick={() => onOccupiedClick(cell.booking_id)}
                    title={`${cell.customer_name} · ${statusWord[cell.status] ?? cell.status}`}
                    className={`flex h-14 flex-col items-start justify-center gap-0.5 rounded-md border px-2 text-left transition ${cellStyle[cell.status] ?? "border-slate-200 bg-slate-100 text-slate-500"}`}
                  >
                    <span className="w-full truncate text-xs font-semibold leading-tight">{firstName(cell.customer_name)}</span>
                    <span className="flex items-center gap-1 text-[10px] font-medium opacity-80">
                      {cell.source === "walkin" ? "Walk-in" : statusWord[cell.status] ?? ""}
                    </span>
                  </button>
                );
              }
              const past = isPast(hour);
              if (past) {
                return (
                  <div
                    key={court.id + hour}
                    className="h-14 rounded-md border border-slate-200 bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_6px,#e2e8f0_6px,#e2e8f0_12px)]"
                    aria-hidden
                  />
                );
              }
              return (
                <button
                  key={court.id + hour}
                  type="button"
                  onClick={() => onEmptyClick(court.id, hour)}
                  className="group flex h-14 items-center justify-center rounded-md border border-dashed border-slate-200 bg-white text-slate-300 transition hover:border-[var(--color-brand)] hover:bg-blue-50 hover:text-[var(--color-brand)]"
                >
                  <span className="text-xs font-medium opacity-0 transition group-hover:opacity-100">+ Walk-in</span>
                  <span className="text-lg leading-none group-hover:hidden">+</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BoardLegend() {
  const items: [string, string][] = [
    ["Confirmed", "border border-emerald-200 bg-emerald-50"],
    ["Pending payment", "border border-amber-200 bg-amber-50"],
    ["Completed", "border border-slate-200 bg-slate-100"],
    ["Open — tap to add walk-in", "border border-dashed border-slate-300 bg-white"],
    ["Past", "bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_4px,#e2e8f0_4px,#e2e8f0_8px)]"],
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
