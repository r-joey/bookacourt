import { redirect } from "next/navigation";
import { getProfile, getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { peso, shortDate } from "@/lib/format";
import { InvoicePayPanel } from "@/components/invoice-pay-panel";

export default async function SuspendedPage() {
  const [user, profile] = await Promise.all([getSessionUser(), getProfile()]);
  if (!user || !profile) redirect("/login");
  if (profile.role === "platform_admin") redirect("/admin");
  if (!profile.is_suspended) redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: settings }, { data: invoices }] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("payment_qr_url, payment_label, payment_account_name, payment_account_number, payment_note")
      .maybeSingle(),
    supabase
      .from("invoices")
      .select("*")
      .eq("tenant_id", user.id)
      .in("status", ["overdue", "pending", "submitted"])
      .order("due_date"),
  ]);

  const due = invoices ?? [];

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

      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="card p-6 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50 text-2xl">⚠️</div>
          <h1 className="mt-4 text-xl font-bold">Your account is suspended</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Your venues aren’t accepting bookings because you have an unpaid invoice. Settle it below
            and your access is restored once we approve the payment.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {due.length === 0 ? (
            <div className="card p-6 text-center text-sm text-slate-500">
              No outstanding invoices found. Please contact support to restore access.
            </div>
          ) : (
            due.map((inv) => (
              <div key={inv.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-sm">{inv.invoice_number}</span>
                  <div className="text-right">
                    <span className="text-lg font-bold">{peso(inv.amount)}</span>
                    <span className="ml-2 text-xs text-slate-400">due {shortDate(inv.due_date)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <InvoicePayPanel invoice={inv} payment={settings ?? null} />
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
