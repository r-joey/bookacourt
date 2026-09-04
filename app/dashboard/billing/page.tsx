import { getProfile, getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { peso, shortDate, addDaysKey } from "@/lib/format";
import { InvoicePayPanel } from "@/components/invoice-pay-panel";

function monthBefore(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 2, d));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

const badgeFor: Record<string, string> = {
  pending: "badge-amber",
  submitted: "badge-blue",
  overdue: "badge-red",
  paid: "badge-green",
  void: "badge-gray",
};

export default async function BillingPage() {
  const [profile, user] = await Promise.all([getProfile(), getSessionUser()]);
  if (!profile) return null;

  const supabase = await createClient();
  const [{ data: settings }, { data: invoices }] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("price_per_court, currency, invoice_grace_days, payment_qr_url, payment_label, payment_account_name, payment_account_number, payment_note")
      .maybeSingle(),
    supabase.from("invoices").select("*").eq("tenant_id", user!.id).order("created_at", { ascending: false }),
  ]);

  const price = settings?.price_per_court ?? 100;
  const dueInvoices = (invoices ?? []).filter((i) => ["pending", "overdue", "submitted"].includes(i.status));
  const nextDate = profile.next_invoice_date;
  const cycleStart = nextDate ? monthBefore(nextDate) : profile.billing_start_date;

  let currentCount = 0;
  if (cycleStart && nextDate) {
    const { count } = await supabase
      .from("court_creation_events")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", user!.id)
      .gte("created_at", `${cycleStart}T00:00:00+08:00`)
      .lt("created_at", `${nextDate}T00:00:00+08:00`);
    currentCount = count ?? 0;
  }
  const estimate = currentCount * price;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          You’re charged {peso(price)} per court created in each monthly cycle.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Current cycle</p>
          <p className="mt-2 text-sm text-slate-600">
            {cycleStart ? shortDate(cycleStart) : "—"} → {nextDate ? shortDate(nextDate) : "—"}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Courts created this cycle</p>
          <p className="mt-2 text-3xl font-bold">{currentCount}</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Estimated next invoice</p>
          <p className="mt-2 text-3xl font-bold">{peso(estimate)}</p>
          <p className="mt-1 text-xs text-slate-400">Due {nextDate ? shortDate(addDaysKey(nextDate, settings?.invoice_grace_days ?? 7)) : "—"}</p>
        </div>
      </div>

      {dueInvoices.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Amount due</h2>
          <div className="space-y-4">
            {dueInvoices.map((inv) => (
              <div key={inv.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm">{inv.invoice_number}</span>
                    <span className={`ml-2 ${badgeFor[inv.status]}`}>{inv.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{peso(inv.amount)}</span>
                    <span className="ml-2 text-xs text-slate-400">due {shortDate(inv.due_date)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <InvoicePayPanel invoice={inv} payment={settings ?? null} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold">Invoice history</h2>
        <div className="card overflow-hidden">
          {(invoices ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No invoices yet. Your first one generates on {nextDate ? shortDate(nextDate) : "your cycle date"}.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Courts</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoices ?? []).map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{shortDate(inv.period_start)} – {shortDate(inv.period_end)}</td>
                    <td className="px-4 py-3">{inv.court_count} × {peso(inv.unit_price)}</td>
                    <td className="px-4 py-3 font-semibold">{peso(inv.amount)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{shortDate(inv.due_date)}</td>
                    <td className="px-4 py-3"><span className={badgeFor[inv.status]}>{inv.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
