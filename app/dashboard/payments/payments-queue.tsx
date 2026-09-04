"use client";

import { useState, useTransition } from "react";
import { confirmBooking, cancelBooking } from "@/app/dashboard/actions";
import { peso, timeFromISO, shortDate } from "@/lib/format";

type Slot = { starts_at: string; ends_at: string; price: number; courts: { name: string } | null };
type Row = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  booking_date: string;
  subtotal: number;
  payment_proof_url: string | null;
  hold_expires_at: string | null;
  booking_slots: Slot[];
  payment_methods: { label: string } | null;
};

export function PaymentsQueue({ bookings }: { bookings: Row[] }) {
  const [enlarged, setEnlarged] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Review proof of payment, then confirm or reject.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="card p-10 text-center text-sm text-slate-400">No payments waiting right now.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <PaymentCard key={b.id} b={b} onEnlarge={setEnlarged} />
          ))}
        </div>
      )}

      {enlarged && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setEnlarged(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enlarged} alt="proof" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </div>
  );
}

function PaymentCard({ b, onEnlarge }: { b: Row; onEnlarge: (url: string) => void }) {
  const [pending, startTransition] = useTransition();
  const slots = [...b.booking_slots].sort((a, s) => a.starts_at.localeCompare(s.starts_at));

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{b.customer_name}</p>
            <span className="badge-gray font-mono">{b.booking_code}</span>
            {b.payment_proof_url ? <span className="badge-blue">Proof uploaded</span> : <span className="badge-amber">Awaiting proof</span>}
          </div>
          <p className="mt-0.5 text-sm text-slate-500">
            {shortDate(b.booking_date)} · {b.customer_phone ?? ""} {b.customer_email ? `· ${b.customer_email}` : ""}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {slots.map((s, i) => (
              <li key={i} className="flex justify-between gap-6">
                <span className="text-slate-600">{s.courts?.name} · {timeFromISO(s.starts_at)}–{timeFromISO(s.ends_at)}</span>
                <span>{peso(s.price)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 border-t border-slate-100 pt-2 text-sm font-semibold">Total {peso(b.subtotal)} · {b.payment_methods?.label ?? "—"}</p>
        </div>

        {b.payment_proof_url && (
          <button onClick={() => onEnlarge(b.payment_proof_url!)} className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.payment_proof_url} alt="proof" className="h-28 w-28 rounded-lg border border-slate-200 object-cover" />
            <span className="mt-1 block text-center text-xs text-[var(--color-brand)]">Tap to enlarge</span>
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="btn-primary"
          disabled={pending}
          onClick={() => startTransition(() => confirmBooking(b.id))}
        >
          Confirm booking
        </button>
        <button
          className="btn-ghost text-red-600"
          disabled={pending}
          onClick={() => confirm("Reject this booking? The slots will be released.") && startTransition(() => cancelBooking(b.id))}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
