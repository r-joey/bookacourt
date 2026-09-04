"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { peso, shortDate, timeFromISO, STATUS_LABELS } from "@/lib/format";

type Result = {
  booking_code: string;
  venue_name: string;
  customer_name: string;
  status: string;
  booking_date: string;
  subtotal: number;
  slots: { court_name: string; starts_at: string; ends_at: string; price: number }[];
};

const badgeFor: Record<string, string> = {
  pending_payment: "badge-amber", confirmed: "badge-green", completed: "badge-blue",
  cancelled: "badge-red", expired: "badge-gray",
};

export function FindBooking() {
  const [code, setCode] = useState("");
  const [contact, setContact] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotFound(false);
    setResult(null);
    const supabase = createClient();
    const { data } = await supabase.rpc("find_booking", { p_code: code, p_contact: contact });
    setBusy(false);
    if (data) setResult(data as unknown as Result);
    else setNotFound(true);
  }

  return (
    <div className="space-y-5">
      <form onSubmit={search} className="card space-y-4 p-6">
        <h2 className="font-semibold">Find my booking</h2>
        <div>
          <label className="label">Booking code</label>
          <input className="input uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. K7QP2M" required />
        </div>
        <div>
          <label className="label">Email or phone used</label>
          <input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@email.com or 0917…" required />
        </div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Searching…" : "Find booking"}</button>
      </form>

      {notFound && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No booking found with that code and contact. Double-check and try again.
        </p>
      )}

      {result && (
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-bold tracking-widest">{result.booking_code}</span>
            <span className={badgeFor[result.status] ?? "badge-gray"}>{STATUS_LABELS[result.status]}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{result.customer_name} · {shortDate(result.booking_date)}</p>
          <ul className="mt-4 space-y-1.5 text-sm">
            {result.slots.map((s, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span className="text-slate-600">{s.court_name} · {timeFromISO(s.starts_at)}–{timeFromISO(s.ends_at)}</span>
                <span>{peso(s.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold">
            <span>Total</span><span>{peso(result.subtotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
