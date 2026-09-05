"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { peso, shortDate, timeFromISO, hourFromISO, STATUS_LABELS } from "@/lib/format";
import type { BookingGroup } from "./booking-drawer";

type SlotRow = { court_id: string; starts_at: string; ends_at: string; price: number; courts: { name: string } | null };
type Row = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  status: string;
  source: string;
  subtotal: number;
  booking_date: string;
  payment_proof_url: string | null;
  hold_expires_at: string | null;
  booking_slots: SlotRow[];
};

const TABS = [
  { key: "all", label: "All" },
  { key: "pending_payment", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const badgeFor: Record<string, string> = {
  pending_payment: "badge-amber",
  confirmed: "badge-green",
  completed: "badge-blue",
  cancelled: "badge-red",
  expired: "badge-gray",
};

export function toBookingGroup(r: Row): BookingGroup {
  return {
    id: r.id,
    code: r.booking_code,
    customer_name: r.customer_name,
    customer_phone: r.customer_phone,
    customer_email: r.customer_email,
    status: r.status,
    source: r.source,
    subtotal: r.subtotal,
    booking_date: r.booking_date,
    payment_proof_url: r.payment_proof_url,
    hold_expires_at: r.hold_expires_at,
    slots: (r.booking_slots ?? []).map((s) => ({
      court_id: s.court_id,
      court_name: s.courts?.name ?? "Court",
      hour: hourFromISO(s.starts_at),
      price: s.price,
    })),
  };
}

export function BookingsList({
  venueId,
  refreshKey,
  onOpen,
}: {
  venueId: string;
  refreshKey: number;
  onOpen: (b: BookingGroup) => void;
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("bookings")
      .select("id, booking_code, customer_name, customer_phone, customer_email, status, source, subtotal, booking_date, payment_proof_url, hold_expires_at, booking_slots(court_id, starts_at, ends_at, price, courts(name))")
      .eq("venue_id", venueId)
      .order("booking_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as unknown as Row[]) ?? []);
    setLoading(false);
  }, [venueId]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab !== "all" && r.status !== tab) return false;
      if (!needle) return true;
      return (
        r.customer_name?.toLowerCase().includes(needle) ||
        r.booking_code?.toLowerCase().includes(needle) ||
        r.customer_phone?.toLowerCase().includes(needle) ||
        r.customer_email?.toLowerCase().includes(needle)
      );
    });
  }, [rows, tab, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium ${
                tab === t.key ? "bg-[var(--color-brand)] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="input max-w-[240px] shrink-0"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, code, contact…"
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No bookings here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Slots</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => {
                  const slots = [...(b.booking_slots ?? [])].sort((a, s) => a.starts_at.localeCompare(s.starts_at));
                  return (
                    <tr
                      key={b.id}
                      className="cursor-pointer align-top transition hover:bg-slate-50"
                      onClick={() => onOpen(toBookingGroup(b))}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{b.customer_name}</p>
                        <p className="font-mono text-xs text-slate-400">{b.booking_code} · {b.source === "walkin" ? "Walk-in" : "Online"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{shortDate(b.booking_date)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {slots.slice(0, 2).map((s, i) => (
                          <div key={i} className="whitespace-nowrap">{s.courts?.name} · {timeFromISO(s.starts_at)}</div>
                        ))}
                        {slots.length > 2 && <div className="text-xs text-slate-400">+{slots.length - 2} more</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{peso(b.subtotal)}</td>
                      <td className="px-4 py-3"><span className={badgeFor[b.status] ?? "badge-gray"}>{STATUS_LABELS[b.status] ?? b.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
