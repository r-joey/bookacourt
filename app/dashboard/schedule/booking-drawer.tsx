"use client";

import { useEffect, useState } from "react";
import { peso, shortDate, hourRange, STATUS_LABELS } from "@/lib/format";

export type DrawerSlot = { court_id: string; court_name: string; hour: number; price: number };

export type BookingGroup = {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  status: string;
  source: string;
  subtotal: number;
  booking_date: string;
  payment_proof_url: string | null;
  hold_expires_at: string | null;
  slots: DrawerSlot[];
};

export type WalkinTarget = { court_id: string; court_name: string; hour: number; price: number; date: string };

const badgeFor: Record<string, string> = {
  pending_payment: "badge-amber",
  confirmed: "badge-green",
  completed: "badge-blue",
  cancelled: "badge-red",
  expired: "badge-gray",
};

export function BookingDrawer({
  booking,
  walkin,
  busy,
  error,
  onClose,
  onConfirm,
  onComplete,
  onCancel,
  onWalkin,
}: {
  booking: BookingGroup | null;
  walkin: WalkinTarget | null;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onWalkin: (t: WalkinTarget, name: string, phone: string) => void;
}) {
  const open = !!booking || !!walkin;
  const [shown, setShown] = useState(false);
  const [enlarge, setEnlarge] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open) {
      const r = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(r);
    }
    setShown(false);
    setEnlarge(false);
    setName("");
    setPhone("");
  }, [open, booking?.id, walkin?.court_id, walkin?.hour]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const slots = booking ? [...booking.slots].sort((a, b) => a.court_name.localeCompare(b.court_name) || a.hour - b.hour) : [];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={walkin ? "New walk-in" : "Booking details"}>
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />
      <div
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-200 ease-out ${shown ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          {walkin ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">New walk-in</p>
              <h2 className="mt-0.5 text-lg font-bold">{walkin.court_name}</h2>
              <p className="text-sm text-slate-500">{shortDate(walkin.date)} · {hourRange(walkin.hour)}</p>
            </div>
          ) : booking ? (
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-bold">{booking.customer_name}</h2>
                <span className={badgeFor[booking.status] ?? "badge-gray"}>{STATUS_LABELS[booking.status] ?? booking.status}</span>
              </div>
              <p className="mt-0.5 font-mono text-xs text-slate-400">
                {booking.code} · {booking.source === "walkin" ? "Walk-in" : "Online"} · {shortDate(booking.booking_date)}
              </p>
            </div>
          ) : null}
          <button className="btn-ghost btn-sm shrink-0" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {walkin ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">{walkin.court_name} · {hourRange(walkin.hour)}</span><span className="font-semibold">{peso(walkin.price)}</span></div>
              </div>
              <div>
                <label className="label">Customer name (optional)</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Walk-in" />
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0917 000 0000" />
              </div>
            </div>
          ) : booking ? (
            <div className="space-y-4">
              {(booking.customer_phone || booking.customer_email) && (
                <div className="text-sm text-slate-600">
                  {booking.customer_phone && <p>{booking.customer_phone}</p>}
                  {booking.customer_email && <p className="break-all">{booking.customer_email}</p>}
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Slots</p>
                <ul className="space-y-1.5 text-sm">
                  {slots.map((s, i) => (
                    <li key={i} className="flex justify-between gap-4">
                      <span className="text-slate-600">{s.court_name} · {hourRange(s.hour)}</span>
                      <span>{peso(s.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-semibold">
                  <span>Total</span><span>{peso(booking.subtotal)}</span>
                </div>
              </div>

              {booking.source === "online" && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment proof</p>
                  {booking.payment_proof_url ? (
                    <button onClick={() => setEnlarge(true)} className="block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={booking.payment_proof_url} alt="Payment proof" className="h-40 w-40 rounded-lg border border-slate-200 object-cover" />
                      <span className="mt-1 block text-xs text-[var(--color-brand)]">Tap to enlarge</span>
                    </button>
                  ) : (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">No proof uploaded yet.</p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-5 py-4">
          {walkin ? (
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
              <button className="btn-primary flex-1" disabled={busy} onClick={() => onWalkin(walkin, name, phone)}>
                {busy ? "Booking…" : `Book walk-in · ${peso(walkin.price)}`}
              </button>
            </div>
          ) : booking ? (
            <div className="flex flex-wrap gap-2">
              {booking.status === "pending_payment" && (
                <button className="btn-primary flex-1" disabled={busy} onClick={() => onConfirm(booking.id)}>
                  {busy ? "Working…" : "Confirm booking"}
                </button>
              )}
              {booking.status === "confirmed" && (
                <button className="btn-primary flex-1" disabled={busy} onClick={() => onComplete(booking.id)}>
                  {busy ? "Working…" : "Mark complete"}
                </button>
              )}
              {(booking.status === "pending_payment" || booking.status === "confirmed") && (
                <button
                  className="btn-ghost text-red-600"
                  disabled={busy}
                  onClick={() => { if (confirm(booking.status === "pending_payment" ? "Reject this booking? The slots will be released." : "Cancel this booking? The slots will be released.")) onCancel(booking.id); }}
                >
                  {booking.status === "pending_payment" ? "Reject" : "Cancel"}
                </button>
              )}
              {booking.status === "completed" && (
                <p className="w-full text-center text-sm text-slate-400">This booking is closed.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {enlarge && booking?.payment_proof_url && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-black/80 p-4" onClick={() => setEnlarge(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={booking.payment_proof_url} alt="Payment proof" className="max-h-[90vh] max-w-[90vw] rounded-lg" />
        </div>
      )}
    </div>
  );
}
