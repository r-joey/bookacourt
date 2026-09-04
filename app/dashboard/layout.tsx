import Link from "next/link";
import { requireTenant, getMyVenues, getActiveVenue, getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { VenueSwitcher } from "@/components/venue-switcher";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireTenant();
  const [user, venues, active] = await Promise.all([
    getSessionUser(),
    getMyVenues(),
    getActiveVenue(),
  ]);
  const isOwner = !!active && active.owner_id === user!.id;

  // Onboarding shell — no venues yet.
  if (venues.length === 0) {
    return (
      <div className="min-h-screen">
        <header className="flex items-center justify-between border-b border-[var(--color-line)] bg-white px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-brand)] text-white font-bold">B</span>
            <span className="font-bold">BookaCourt</span>
          </div>
          <form action={signOut}>
            <button className="text-sm text-slate-500 hover:text-slate-800">Sign out</button>
          </form>
        </header>
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">{children}</main>
      </div>
    );
  }

  // Is online booking possible? (needs an active QR payment method)
  let needsPaymentQr = false;
  if (active) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("payment_methods")
      .select("id", { count: "exact", head: true })
      .eq("venue_id", active.id)
      .eq("is_active", true)
      .not("qr_url", "is", null);
    needsPaymentQr = (count ?? 0) === 0;
  }

  const sidebar = (
    <div className="flex h-full flex-col px-3 py-3">
      <VenueSwitcher venues={venues} activeId={active?.id} role={isOwner ? "owner" : "staff"} />
      <div className="mt-3 flex-1 overflow-y-auto">
        <DashboardNav isOwner={isOwner} />
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 px-2 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs font-semibold text-white">
          {(profile.full_name ?? "U").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{profile.full_name ?? "You"}</p>
          <form action={signOut}>
            <button className="text-xs text-slate-400 hover:text-slate-600">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );

  const banner = needsPaymentQr ? (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
      <div>
        <p className="text-sm font-semibold text-amber-900">Your venue can’t accept online bookings yet</p>
        <p className="text-sm text-amber-800">Upload a payment QR so customers can pay for bookings.</p>
      </div>
      <Link href="/dashboard/qr-codes" className="btn-primary btn-sm">Add a QR code</Link>
    </div>
  ) : null;

  return (
    <DashboardShell sidebar={sidebar} banner={banner} title={active?.name ?? "BookaCourt"}>
      {children}
    </DashboardShell>
  );
}
