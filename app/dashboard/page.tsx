import Link from "next/link";
import { getActiveVenue } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { peso, todayKey, longDate, timeFromISO, hourFromISO } from "@/lib/format";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default async function OverviewPage() {
  const venue = await getActiveVenue();
  if (!venue) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-bold">Create your first venue</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Set up a venue to add courts, take bookings and get paid.
        </p>
        <Link href="/dashboard/new-venue" className="btn-primary mt-5">Create a venue</Link>
      </div>
    );
  }

  const supabase = await createClient();
  const today = todayKey();
  const weekday = new Date(today + "T00:00:00").getUTCDay();

  const [{ data: courts }, { data: hours }, { data: slots }, { data: pendings }] = await Promise.all([
    supabase.from("courts").select("id").eq("venue_id", venue.id).is("deleted_at", null).eq("is_active", true),
    supabase.from("venue_hours").select("*").eq("venue_id", venue.id).eq("weekday", weekday).maybeSingle(),
    supabase
      .from("booking_slots")
      .select("id, price, status, court_id, starts_at, bookings!inner(status, source, customer_name, booking_code)")
      .eq("venue_id", venue.id)
      .gte("starts_at", today + "T00:00:00+08:00")
      .lte("starts_at", today + "T23:59:59+08:00"),
    supabase
      .from("bookings")
      .select("id")
      .eq("venue_id", venue.id)
      .eq("status", "pending_payment")
      .not("payment_proof_url", "is", null),
  ]);

  const courtCount = courts?.length ?? 0;
  const activeSlots = (slots ?? []).filter((s) => ["pending_payment", "confirmed", "completed"].includes(s.status));
  const openHours = hours && !hours.is_closed
    ? Math.max(0, parseInt(hours.closes) - parseInt(hours.opens))
    : 0;
  const capacity = courtCount * openHours;
  const bookedToday = activeSlots.length;
  const revenue = (slots ?? [])
    .filter((s) => ["confirmed", "completed"].includes(s.status))
    .reduce((sum, s) => sum + (s.price ?? 0), 0);

  const distinctBookings = new Set(
    activeSlots.map((s) => (s as { bookings: { booking_code: string } }).bookings.booking_code),
  );

  const nextUp = [...activeSlots]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .filter((s) => new Date(s.starts_at) >= new Date())
    .slice(0, 5);

  const courtName = new Map((courts ?? []).map((c) => [c.id, ""]));
  const { data: courtNames } = await supabase.from("courts").select("id, name").eq("venue_id", venue.id);
  for (const c of courtNames ?? []) courtName.set(c.id, c.name);

  const pendingCount = pendings?.length ?? 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400">{longDate(today)}</p>
      <h1 className="text-2xl font-bold tracking-tight">Today</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today's bookings" value={String(distinctBookings.size)} sub={`${courtCount} court${courtCount === 1 ? "" : "s"}`} />
        <Stat label="Pending payment" value={String(pendingCount)} sub={pendingCount ? "Needs review" : "All clear"} />
        <Stat label="Open slots left" value={String(Math.max(0, capacity - bookedToday))} sub={`of ${capacity} today`} />
        <Stat label="Revenue today" value={peso(revenue)} sub="Confirmed + walk-ins" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Next up</h2>
            <Link href="/dashboard/schedule" className="text-sm font-medium text-[var(--color-brand)]">Open schedule →</Link>
          </div>
          <div className="card divide-y divide-slate-100">
            {nextUp.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No bookings for today yet.</p>
            ) : (
              nextUp.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {(s as { bookings: { customer_name: string } }).bookings.customer_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {courtName.get(s.court_id)} · {timeFromISO(s.starts_at)}
                    </p>
                  </div>
                  <span className={s.status === "confirmed" ? "badge-green" : "badge-amber"}>
                    {s.status === "confirmed" ? "Confirmed" : "Pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Needs you</p>
            <p className="mt-2 text-sm text-slate-600">
              {pendingCount ? `${pendingCount} payment${pendingCount === 1 ? "" : "s"} to review` : "No payments waiting right now."}
            </p>
            <Link href="/dashboard/payments" className="btn-primary mt-4 w-full">Open the queue</Link>
          </div>
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Court utilisation today</p>
            <p className="mt-2 text-sm text-slate-600">
              {capacity === 0 ? "Add courts to see utilisation." : `${bookedToday} of ${capacity} slots booked`}
            </p>
            {capacity > 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full bg-[var(--color-brand)]" style={{ width: `${Math.min(100, (bookedToday / capacity) * 100)}%` }} />
              </div>
            )}
          </div>
          <Link href="/dashboard/schedule" className="card block p-4 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Open the schedule board
          </Link>
        </div>
      </div>
    </div>
  );
}
