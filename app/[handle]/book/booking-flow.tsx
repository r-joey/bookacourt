"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SlotGrid, GridLegend, slotKey, type GridCourt } from "@/components/slot-grid";
import { QrPayment } from "@/components/qr-payment";
import { compressImage } from "@/lib/image-compress";
import {
  longDate, shortDate, todayKey, addDaysKey, weekdayOfKey, hoursList, currentHourManila, peso, hourRange,
} from "@/lib/format";

type Hours = { weekday: number; opens: string; closes: string; is_closed: boolean };
type Method = { id: string; label: string; qr_url: string | null; account_name: string | null; account_number: string | null; note: string | null };
type Status = "pending_payment" | "confirmed" | "completed" | "cancelled" | "expired";
type Picked = { court_id: string; court_name: string; hour: number; price: number };

const STEPS = ["Selection", "Details", "Pay", "Confirmation"];

export function BookingFlow({
  venueId, venueSlug, courts, hours, methods,
}: {
  venueId: string; venueSlug: string; courts: GridCourt[]; hours: Hours[]; methods: Method[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(todayKey());
  const [statusByKey, setStatusByKey] = useState<Record<string, Status>>({});
  const [priceByKey, setPriceByKey] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Map<string, Picked>>(new Map());
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [booking, setBooking] = useState<{ id: string; code: string; subtotal: number; holdExpiresAt: string } | null>(null);
  const [methodId, setMethodId] = useState<string>(methods[0]?.id ?? "");
  const [proofUrl, setProofUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sportFilter, setSportFilter] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const dateRef = useRef<HTMLInputElement>(null);

  // Persist the in-progress booking so an accidental reload during payment
  // resumes at the Pay step instead of losing the held slots + upload form.
  const SESSION_KEY = `bookacourt:booking:${venueId}`;
  const clearSession = useCallback(() => {
    try { localStorage.removeItem(SESSION_KEY); } catch {}
  }, [SESSION_KEY]);
  const patchSession = useCallback((patch: Record<string, unknown>) => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const cur = raw ? JSON.parse(raw) : {};
      localStorage.setItem(SESSION_KEY, JSON.stringify({ ...cur, ...patch }));
    } catch {}
  }, [SESSION_KEY]);

  const sports = [...new Set(courts.map((c) => c.sport).filter(Boolean))] as string[];
  const visibleCourts = sportFilter ? courts.filter((c) => c.sport === sportFilter) : courts;

  const loadAvailability = useCallback(async () => {
    const [{ data: avail }, { data: prices }] = await Promise.all([
      supabase.rpc("get_availability", { p_venue_id: venueId, p_date: date }),
      supabase.rpc("get_day_prices", { p_venue_id: venueId, p_date: date }),
    ]);
    const map: Record<string, Status> = {};
    for (const row of avail ?? []) map[slotKey(row.court_id, row.hour)] = row.status as Status;
    setStatusByKey(map);
    const pmap: Record<string, number> = {};
    for (const row of prices ?? []) pmap[slotKey(row.court_id, row.hour)] = row.price;
    setPriceByKey(pmap);
  }, [supabase, venueId, date]);

  // On mount: restore a still-valid held booking, else start fresh.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.bookingId && s.holdExpiresAt && new Date(s.holdExpiresAt).getTime() > Date.now()) {
          setBooking({ id: s.bookingId, code: s.code, subtotal: s.subtotal, holdExpiresAt: s.holdExpiresAt });
          setDate(s.date || todayKey());
          setCustomer(s.customer || { name: "", email: "", phone: "" });
          setMethodId(s.methodId || methods[0]?.id || "");
          setProofUrl(s.proofUrl || "");
          if (Array.isArray(s.slots)) {
            setSelected(new Map(s.slots.map((sl: Picked) => [slotKey(sl.court_id, sl.hour), sl])));
          }
          setStep(3);
        } else {
          clearSession();
        }
      }
    } catch {
      clearSession();
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (step === 1) {
      setSelected(new Map());
      loadAvailability();
    }
  }, [hydrated, step, loadAvailability]);

  function openDatePicker() {
    const el = dateRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try { el.showPicker(); return; } catch {}
    }
    el.focus();
    el.click();
  }

  function chooseMethod(id: string) {
    setMethodId(id);
    patchSession({ methodId: id });
  }

  const wd = weekdayOfKey(date);
  const dayHours = hours.find((h) => h.weekday === wd);
  const hourRows = dayHours && !dayHours.is_closed ? hoursList(dayHours.opens, dayHours.closes) : [];
  const isToday = date === todayKey();
  const nowHour = currentHourManila();
  const total = [...selected.values()].reduce((s, x) => s + x.price, 0);
  const orderedSlots = [...selected.values()].sort((a, b) => a.court_name.localeCompare(b.court_name) || a.hour - b.hour);

  function toggle(key: string, court: GridCourt, hour: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, { court_id: court.id, court_name: court.name, hour, price: priceByKey[slotKey(court.id, hour)] ?? court.hourly_price });
      return next;
    });
  }

  // Step 2 -> 3: create the hold.
  async function continueToPayment() {
    setError("");
    if (!customer.name.trim()) { setError("Please enter your name."); return; }
    setBusy(true);
    const slots = [...selected.values()].map((s) => ({ court_id: s.court_id, hour: s.hour }));
    const { data, error: rpcErr } = await supabase.rpc("create_online_booking", {
      p_venue_id: venueId,
      p_date: date,
      p_customer_name: customer.name,
      p_customer_email: customer.email,
      p_customer_phone: customer.phone,
      p_slots: slots,
    });
    setBusy(false);
    if (rpcErr) { setError(rpcErr.message); return; }
    const res = data as { booking_id: string; booking_code: string; subtotal: number; hold_expires_at: string };
    setBooking({ id: res.booking_id, code: res.booking_code, subtotal: res.subtotal, holdExpiresAt: res.hold_expires_at });
    patchSession({
      bookingId: res.booking_id,
      code: res.booking_code,
      subtotal: res.subtotal,
      holdExpiresAt: res.hold_expires_at,
      date,
      customer,
      methodId,
      proofUrl: "",
      slots: [...selected.values()],
    });
    setStep(3);
  }

  async function uploadProof(file: File) {
    if (!booking) return;
    setError("");
    if (file.size > 30 * 1024 * 1024) { setError("File is too large (max 30 MB)."); return; }
    setBusy(true);
    try {
      const image = await compressImage(file);
      if (image.size > 5 * 1024 * 1024) throw new Error("Image is still over 5 MB after optimizing — try a smaller one.");
      const ext = image.name.split(".").pop() || "png";
      const path = `${booking.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, image);
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path);
      setProofUrl(data.publicUrl);
      patchSession({ proofUrl: data.publicUrl });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function confirmPayment() {
    if (!booking || !proofUrl || !methodId) return;
    setBusy(true);
    setError("");
    const { error: rpcErr } = await supabase.rpc("attach_payment_proof", {
      p_booking_id: booking.id,
      p_payment_method_id: methodId,
      p_proof_url: proofUrl,
    });
    setBusy(false);
    if (rpcErr) { setError(rpcErr.message); return; }
    clearSession();
    setStep(4);
  }

  async function cancelBooking() {
    if (booking) await supabase.rpc("cancel_online_booking", { p_booking_id: booking.id });
    clearSession();
    setBooking(null);
    setProofUrl("");
    setStep(1);
  }

  const chosenMethod = methods.find((m) => m.id === methodId);

  if (!hydrated) {
    return <div className="card p-10 text-center text-sm text-slate-400">Loading…</div>;
  }

  return (
    <div>
      {/* Steps */}
      <div className="mb-6 flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = n === step;
          const doneStep = n < step;
          return (
            <span key={label} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm ${active ? "border-[var(--color-brand)] bg-blue-50 font-semibold text-[var(--color-brand)]" : doneStep ? "border-slate-200 text-slate-500" : "border-slate-200 text-slate-400"}`}>
              <span className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${active || doneStep ? "bg-[var(--color-brand)] text-white" : "bg-slate-200 text-slate-500"}`}>{n}</span>
              {label}
            </span>
          );
        })}
      </div>

      {/* STEP 1 — selection */}
      {step === 1 && (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {sports.length > 1 ? (
              <div className="flex min-w-0 gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <FilterPill active={sportFilter === null} onClick={() => setSportFilter(null)}>All courts</FilterPill>
                {sports.map((s) => (
                  <FilterPill key={s} active={sportFilter === s} onClick={() => setSportFilter(s)}>{s}</FilterPill>
                ))}
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
            <div className="order-first flex shrink-0 items-center gap-2 sm:order-none">
              <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, -1))} disabled={date === todayKey()} aria-label="Previous day">←</button>
              <div className="relative">
                <input
                  ref={dateRef}
                  type="date"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  value={date}
                  min={todayKey()}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
                <button type="button" className="btn-ghost btn-sm gap-1.5" onClick={openDatePicker} aria-label="Pick a date">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {shortDate(date)}
                </button>
              </div>
              <button className="btn-ghost btn-sm" onClick={() => setDate(addDaysKey(date, 1))} aria-label="Next day">→</button>
            </div>
          </div>

          {visibleCourts.length === 0 ? (
            <div className="card p-10 text-center text-sm text-slate-400">No courts available.</div>
          ) : dayHours?.is_closed ? (
            <div className="card p-10 text-center text-sm text-slate-400">Closed on this day.</div>
          ) : (
            <div className="card space-y-4 p-4">
              <SlotGrid courts={visibleCourts} hours={hourRows} statusByKey={statusByKey} selected={new Set(selected.keys())} onToggle={toggle} isPast={(h) => (isToday ? h <= nowHour : false)} priceByKey={priceByKey} />
              <GridLegend />
            </div>
          )}

          <StickyBar
            left={selected.size === 0 ? "No slots selected" : `${selected.size} slot${selected.size === 1 ? "" : "s"} selected`}
            sub={`${longDate(date)} · tap a slot to add or remove it`}
            total={total}
            actionLabel="Continue"
            disabled={selected.size === 0}
            onAction={() => setStep(2)}
          />
        </>
      )}

      {/* STEP 2 — details */}
      {step === 2 && (
        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div>
            <h2 className="text-xl font-bold">Your details</h2>
            <p className="mt-1 text-sm text-slate-500">We use this to send your confirmation and find your booking.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="Marisol Reyes" />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} placeholder="you@email.com" />
              </div>
              <div>
                <label className="label">Phone number</label>
                <input className="input" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} placeholder="0917 000 0000" />
              </div>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button className="btn-primary flex-1" onClick={continueToPayment} disabled={busy}>
                  {busy ? "Holding your slots…" : "Continue to payment"}
                </button>
              </div>
            </div>
          </div>
          <OrderSummary date={date} slots={orderedSlots} total={total} />
        </div>
      )}

      {/* STEP 3 — pay */}
      {step === 3 && booking && (
        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          <div>
            <HoldTimer expiresAt={booking.holdExpiresAt} onExpire={() => { clearSession(); setBooking(null); setProofUrl(""); setStep(1); setError("Your hold expired. Please pick your slots again."); }} />
            <h2 className="mt-4 text-xl font-bold">Pay {peso(booking.subtotal)}</h2>

            <p className="mt-4 text-sm font-semibold text-slate-500">1 — Choose how to pay</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {methods.map((m) => (
                <button key={m.id} onClick={() => chooseMethod(m.id)} className={`rounded-lg border px-3 py-1.5 text-sm ${methodId === m.id ? "border-[var(--color-brand)] bg-blue-50 font-semibold text-[var(--color-brand)]" : "border-slate-200"}`}>
                  {m.label}
                </button>
              ))}
            </div>

            {chosenMethod && (
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
                {chosenMethod.qr_url && (
                  <QrPayment url={chosenMethod.qr_url} label={chosenMethod.label} />
                )}
                <div className="text-sm text-slate-600">
                  <p>Scan with your banking app and send exactly <strong>{peso(booking.subtotal)}</strong>. Take a screenshot of the receipt, then upload it below.</p>
                  {chosenMethod.account_name && <p className="mt-2">{chosenMethod.account_name}</p>}
                  {chosenMethod.account_number && <p>{chosenMethod.account_number}</p>}
                  {chosenMethod.note && <p className="mt-1 text-xs text-slate-400">{chosenMethod.note}</p>}
                </div>
              </div>
            )}

            <p className="mt-6 text-sm font-semibold text-slate-500">2 — Upload your proof of payment</p>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center hover:bg-slate-50">
              {proofUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofUrl} alt="proof" className="h-24 rounded" />
              ) : (
                <>
                  <span className="text-sm font-medium">{busy ? "Uploading…" : "Choose a screenshot or photo"}</span>
                  <span className="text-xs text-slate-400">JPG or PNG, up to 5 MB</span>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProof(e.target.files[0])} />
            </label>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div className="mt-4 flex gap-2">
              <button className="btn-ghost" onClick={() => setStep(2)}>Back</button>
              <button className="btn-primary flex-1" onClick={confirmPayment} disabled={busy || !proofUrl}>Confirm payment</button>
            </div>
            <button className="mt-3 text-sm font-medium text-red-600" onClick={cancelBooking}>Cancel booking</button>
          </div>
          <OrderSummary date={date} slots={orderedSlots} total={booking.subtotal} customer={customer} />
        </div>
      )}

      {/* STEP 4 — confirmation */}
      {step === 4 && booking && (
        <div className="card mx-auto max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-2xl">✓</div>
          <h2 className="mt-4 text-xl font-bold">Payment submitted</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your booking is <strong>pending confirmation</strong>. The venue will review your payment and confirm shortly.
          </p>
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Booking code</p>
            <p className="text-2xl font-bold tracking-widest">{booking.code}</p>
          </div>
          <p className="mt-3 text-xs text-slate-400">Keep this code to look up your booking later.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href={`/@${venueSlug}/find`} className="btn-ghost">Find my booking</Link>
            <Link href={`/@${venueSlug}`} className="btn-primary">Done</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? "bg-[var(--color-brand)] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function StickyBar({ left, sub, total, actionLabel, disabled, onAction }: {
  left: string; sub: string; total: number; actionLabel: string; disabled: boolean; onAction: () => void;
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-4 flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
      <div className="min-w-0">
        <p className="font-semibold">{left}</p>
        <p className="truncate text-xs text-slate-400">{sub}</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold">{peso(total)}</span>
        <button className="btn-primary" disabled={disabled} onClick={onAction}>{actionLabel}</button>
      </div>
    </div>
  );
}

function OrderSummary({ date, slots, total, customer }: {
  date: string; slots: Picked[]; total: number; customer?: { name: string; email: string; phone: string };
}) {
  return (
    <aside className="card h-fit p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your slots</p>
      <p className="mt-2 font-medium">{longDate(date)}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {slots.map((s, i) => (
          <li key={i} className="flex justify-between gap-4">
            <span className="text-slate-600">{s.court_name} · {hourRange(s.hour)}</span>
            <span>{peso(s.price)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 font-semibold">
        <span>Total</span><span>{peso(total)}</span>
      </div>
      {customer?.name && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <p>{customer.name}</p>
          {customer.email && <p>{customer.email}</p>}
          {customer.phone && <p>{customer.phone}</p>}
        </div>
      )}
    </aside>
  );
}

function HoldTimer({ expiresAt, onExpire }: { expiresAt: string; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
  useEffect(() => {
    const t = setInterval(() => {
      const r = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) { clearInterval(t); onExpire(); }
    }, 1000);
    return () => clearInterval(t);
  }, [expiresAt, onExpire]);
  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  return (
    <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">
      <strong>{mm}:{ss}</strong> — Your slots are held while you pay. After this they go back to available.
    </div>
  );
}
