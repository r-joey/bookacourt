import Link from "next/link";
import { getActiveVenue } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { peso, shortDate, timeFromISO, STATUS_LABELS } from "@/lib/format";
import { RowActions } from "./row-actions";

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

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const venue = await getActiveVenue();
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;
  const { status = "all" } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("*, booking_slots(starts_at, ends_at, price, courts(name))")
    .eq("venue_id", venue.id)
    .order("created_at", { ascending: false })
    .limit(150);
  if (status !== "all") query = query.eq("status", status as never);
  const { data: bookings } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
        <p className="mt-1 text-sm text-slate-500">Every reservation for {venue.name}.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/dashboard/bookings${t.key === "all" ? "" : `?status=${t.key}`}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              status === t.key ? "bg-[var(--color-brand)] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {(bookings ?? []).length === 0 ? (
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(bookings ?? []).map((b) => {
                  const slots = [...(b.booking_slots as { starts_at: string; ends_at: string; courts: { name: string } | null }[])].sort(
                    (a, s) => a.starts_at.localeCompare(s.starts_at),
                  );
                  return (
                    <tr key={b.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium">{b.customer_name}</p>
                        <p className="font-mono text-xs text-slate-400">{b.booking_code} · {b.source === "walkin" ? "Walk-in" : "Online"}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{shortDate(b.booking_date)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {slots.slice(0, 3).map((s, i) => (
                          <div key={i} className="whitespace-nowrap">{s.courts?.name} · {timeFromISO(s.starts_at)}</div>
                        ))}
                        {slots.length > 3 && <div className="text-xs text-slate-400">+{slots.length - 3} more</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{peso(b.subtotal)}</td>
                      <td className="px-4 py-3"><span className={badgeFor[b.status] ?? "badge-gray"}>{STATUS_LABELS[b.status]}</span></td>
                      <td className="px-4 py-3 text-right"><RowActions id={b.id} status={b.status} /></td>
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
