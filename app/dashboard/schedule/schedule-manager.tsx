"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { confirmBooking, completeBooking, cancelBooking } from "@/app/dashboard/actions";
import { slotKey, type GridCourt } from "@/components/slot-grid";
import { longDate, todayKey, addDaysKey, weekdayOfKey, hoursList, currentHourManila } from "@/lib/format";
import { DayBoard, BoardLegend, type SlotCell } from "./day-board";
import { BookingsList } from "./bookings-list";
import { BookingDrawer, type BookingGroup, type WalkinTarget } from "./booking-drawer";

type Hours = { weekday: number; opens: string; closes: string; is_closed: boolean };
type Status = "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired";

type DayRow = {
  court_id: string;
  hour: number;
  booking_id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  status: Status;
  source: string;
  subtotal: number;
  slot_price: number;
  payment_proof_url: string | null;
  hold_expires_at: string | null;
};

export function ScheduleManager({
  venueId,
  courts,
  hours,
}: {
  venueId: string;
  courts: GridCourt[];
  hours: Hours[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [view, setView] = useState<"board" | "list">("board");
  const [date, setDate] = useState(todayKey());
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [drawerBooking, setDrawerBooking] = useState<BookingGroup | null>(null);
  const [drawerWalkin, setDrawerWalkin] = useState<WalkinTarget | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  const courtName = useCallback((id: string) => courts.find((c) => c.id === id)?.name ?? "Court", [courts]);
  const courtPrice = useCallback((id: string) => courts.find((c) => c.id === id)?.hourly_price ?? 0, [courts]);

  const loadBoard = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc("get_day_bookings", { p_venue_id: venueId, p_date: date });
    setRows((data as DayRow[]) ?? []);
    setLoading(false);
  }, [supabase, venueId, date]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  // Build per-cell labels and per-booking groups from the day's rows.
  const { cellsByKey, groups } = useMemo(() => {
    const cells: Record<string, SlotCell> = {};
    const grp = new Map<string, BookingGroup>();
    for (const r of rows) {
      cells[slotKey(r.court_id, r.hour)] = {
        booking_id: r.booking_id,
        booking_code: r.booking_code,
        customer_name: r.customer_name,
        status: r.status,
        source: r.source,
      };
      let g = grp.get(r.booking_id);
      if (!g) {
        g = {
          id: r.booking_id,
          code: r.booking_code,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          customer_email: r.customer_email,
          status: r.status,
          source: r.source,
          subtotal: r.subtotal,
          booking_date: date,
          payment_proof_url: r.payment_proof_url,
          hold_expires_at: r.hold_expires_at,
          slots: [],
        };
        grp.set(r.booking_id, g);
      }
      g.slots.push({ court_id: r.court_id, court_name: courtName(r.court_id), hour: r.hour, price: r.slot_price });
    }
    return { cellsByKey: cells, groups: grp };
  }, [rows, date, courtName]);

  const wd = weekdayOfKey(date);
  const dayHours = hours.find((h) => h.weekday === wd);
  const hourRows = dayHours && !dayHours.is_closed ? hoursList(dayHours.opens, dayHours.closes) : [];
  const isToday = date === todayKey();
  const nowHour = currentHourManila();

  function closeDrawer() {
    setDrawerBooking(null);
    setDrawerWalkin(null);
    setError("");
  }

  function openOccupied(bookingId: string) {
    const g = groups.get(bookingId);
    if (g) { setError(""); setDrawerWalkin(null); setDrawerBooking(g); }
  }

  function openEmpty(courtId: string, hour: number) {
    setError("");
    setDrawerBooking(null);
    setDrawerWalkin({ court_id: courtId, court_name: courtName(courtId), hour, price: courtPrice(courtId), date });
  }

  function afterMutation() {
    setBusy(false);
    closeDrawer();
    setRefreshKey((k) => k + 1);
    loadBoard();
  }

  function runAction(fn: (id: string) => Promise<void>, id: string) {
    setBusy(true);
    setError("");
    startTransition(async () => {
      try { await fn(id); afterMutation(); }
      catch (e) { setBusy(false); setError((e as Error).message ?? "Something went wrong."); }
    });
  }

  async function doWalkin(t: WalkinTarget, name: string, phone: string) {
    setBusy(true);
    setError("");
    const { error: rpcErr } = await supabase.rpc("create_walkin_booking", {
      p_venue_id: venueId,
      p_date: t.date,
      p_customer_name: name,
      p_customer_phone: phone,
      p_slots: [{ court_id: t.court_id, hour: t.hour }],
    });
    if (rpcErr) { setBusy(false); setError(rpcErr.message); return; }
    afterMutation();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-slate-500">
            {view === "board" ? <>{longDate(date)}{loading ? " · loading…" : ""}</> : "All bookings for this venue."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setView("board")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${view === "board" ? "bg-[var(--color-brand)] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              Board
            </button>
            <button
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${view === "list" ? "bg-[var(--color-brand)] text-white" : "text-slate-600 hover:bg-slate-50"}`}
            >
              List
            </button>
          </div>

          {view === "board" && (
            <div className="flex items-center gap-2">
              <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, -1))} aria-label="Previous day">←</button>
              <button className="btn-ghost btn-sm" onClick={() => setDate(todayKey())} disabled={isToday}>Today</button>
              <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, 1))} aria-label="Next day">→</button>
            </div>
          )}
        </div>
      </div>

      {view === "board" ? (
        courts.length === 0 ? (
          <div className="card p-10 text-center text-sm text-slate-400">Add courts to see the schedule.</div>
        ) : dayHours?.is_closed ? (
          <div className="card p-10 text-center text-sm text-slate-400">Closed on this day.</div>
        ) : (
          <div className="card space-y-4 p-4">
            <DayBoard
              courts={courts}
              hours={hourRows}
              cellsByKey={cellsByKey}
              isPast={(h) => (isToday ? h < nowHour : false)}
              onOccupiedClick={openOccupied}
              onEmptyClick={openEmpty}
            />
            <BoardLegend />
          </div>
        )
      ) : (
        <BookingsList venueId={venueId} refreshKey={refreshKey} onOpen={(b) => { setError(""); setDrawerWalkin(null); setDrawerBooking(b); }} />
      )}

      <BookingDrawer
        booking={drawerBooking}
        walkin={drawerWalkin}
        busy={busy}
        error={error}
        onClose={closeDrawer}
        onConfirm={(id) => runAction(confirmBooking, id)}
        onComplete={(id) => runAction(completeBooking, id)}
        onCancel={(id) => runAction(cancelBooking, id)}
        onWalkin={doWalkin}
      />
    </div>
  );
}
