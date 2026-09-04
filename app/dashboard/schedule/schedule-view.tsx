"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { SlotGrid, GridLegend, slotKey, type GridCourt } from "@/components/slot-grid";
import { longDate, todayKey, addDaysKey, weekdayOfKey, hoursList, currentHourManila } from "@/lib/format";

type Hours = { weekday: number; opens: string; closes: string; is_closed: boolean };
type Status = "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired";

export function ScheduleView({
  venueId,
  courts,
  hours,
}: {
  venueId: string;
  courts: GridCourt[];
  hours: Hours[];
}) {
  const [date, setDate] = useState(todayKey());
  const [statusByKey, setStatusByKey] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("get_availability", { p_venue_id: venueId, p_date: date });
    const map: Record<string, Status> = {};
    for (const row of data ?? []) map[slotKey(row.court_id, row.hour)] = row.status as Status;
    setStatusByKey(map);
    setLoading(false);
  }, [venueId, date]);

  useEffect(() => {
    load();
  }, [load]);

  const wd = weekdayOfKey(date);
  const dayHours = hours.find((h) => h.weekday === wd);
  const hourRows = dayHours && !dayHours.is_closed ? hoursList(dayHours.opens, dayHours.closes) : [];
  const isToday = date === todayKey();
  const nowHour = currentHourManila();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-slate-500">{longDate(date)}{loading ? " · loading…" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, -1))}>←</button>
          <button className="btn-ghost btn-sm" onClick={() => setDate(todayKey())}>Today</button>
          <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, 1))}>→</button>
        </div>
      </div>

      {courts.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-400">Add courts to see the schedule.</div>
      ) : dayHours?.is_closed ? (
        <div className="card p-10 text-center text-sm text-slate-400">Closed on this day.</div>
      ) : (
        <div className="card space-y-4 p-4">
          <SlotGrid
            courts={courts}
            hours={hourRows}
            statusByKey={statusByKey}
            isPast={(h) => (isToday ? h < nowHour : false)}
          />
          <GridLegend />
        </div>
      )}
    </div>
  );
}
