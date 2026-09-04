"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { createWalkin } from "@/app/dashboard/actions";
import { SlotGrid, GridLegend, slotKey, type GridCourt } from "@/components/slot-grid";
import { longDate, todayKey, addDaysKey, weekdayOfKey, hoursList, currentHourManila, peso } from "@/lib/format";

type Hours = { weekday: number; opens: string; closes: string; is_closed: boolean };
type Status = "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired";

export function WalkinFlow({ venueId, courts, hours }: { venueId: string; courts: GridCourt[]; hours: Hours[] }) {
  const [date, setDate] = useState(todayKey());
  const [statusByKey, setStatusByKey] = useState<Record<string, Status>>({});
  const [selected, setSelected] = useState<Map<string, { court_id: string; hour: number; price: number }>>(new Map());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.rpc("get_availability", { p_venue_id: venueId, p_date: date });
    const map: Record<string, Status> = {};
    for (const row of data ?? []) map[slotKey(row.court_id, row.hour)] = row.status as Status;
    setStatusByKey(map);
    setSelected(new Map());
  }, [venueId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const wd = weekdayOfKey(date);
  const dayHours = hours.find((h) => h.weekday === wd);
  const hourRows = dayHours && !dayHours.is_closed ? hoursList(dayHours.opens, dayHours.closes) : [];
  const isToday = date === todayKey();
  const nowHour = currentHourManila();

  const total = [...selected.values()].reduce((s, x) => s + x.price, 0);

  function toggle(key: string, court: GridCourt, hour: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, { court_id: court.id, hour, price: court.hourly_price });
      return next;
    });
  }

  function submit() {
    setError("");
    setDone(null);
    const slots = [...selected.values()].map((s) => ({ court_id: s.court_id, hour: s.hour }));
    const fd = new FormData();
    fd.set("venue_id", venueId);
    fd.set("date", date);
    fd.set("customer_name", name);
    fd.set("customer_phone", phone);
    fd.set("slots", JSON.stringify(slots));
    startTransition(async () => {
      const res = await createWalkin(undefined, fd);
      if (res?.error) setError(res.error);
      else {
        setDone(`Walk-in booked${name ? ` for ${name}` : ""}.`);
        setName("");
        setPhone("");
        await load();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Walk-in booking</h1>
          <p className="mt-1 text-sm text-slate-500">{longDate(date)} · tap slots, then confirm.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, -1))}>←</button>
          <button className="btn-ghost btn-sm" onClick={() => setDate(todayKey())}>Today</button>
          <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, 1))}>→</button>
        </div>
      </div>

      {courts.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-400">Add courts first.</div>
      ) : dayHours?.is_closed ? (
        <div className="card p-10 text-center text-sm text-slate-400">Closed on this day.</div>
      ) : (
        <>
          <div className="card space-y-4 p-4">
            <SlotGrid
              courts={courts}
              hours={hourRows}
              statusByKey={statusByKey}
              selected={new Set(selected.keys())}
              onToggle={toggle}
              isPast={(h) => (isToday ? h < nowHour : false)}
            />
            <GridLegend />
          </div>

          <div className="card p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Customer name (optional)</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Walk-in" />
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 000 0000" />
              </div>
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            {done && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{done}</p>}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                {selected.size} slot{selected.size === 1 ? "" : "s"} · <span className="font-semibold text-slate-900">{peso(total)}</span>
              </p>
              <button className="btn-primary" disabled={pending || selected.size === 0} onClick={submit}>
                {pending ? "Booking…" : "Confirm walk-in"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
