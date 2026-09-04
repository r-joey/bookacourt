import { createClient } from "@/lib/supabase/server";
import { peso, shortDate } from "@/lib/format";
import { ApproveRejectButtons } from "@/app/admin/admin-buttons";

const badgeFor: Record<string, string> = {
  pending: "badge-amber",
  submitted: "badge-blue",
  overdue: "badge-red",
  paid: "badge-green",
  void: "badge-gray",
};

type Row = {
  id: string;
  invoice_number: string;
  tenant_id: string;
  period_start: string;
  period_end: string;
  court_count: number;
  unit_price: number;
  amount: number;
  status: string;
  due_date: string;
  proof_url: string | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

export default async function AdminInvoicesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false });

  const invoices = (data ?? []) as unknown as Row[];
  const submitted = invoices.filter((i) => i.status === "submitted");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
        <p className="mt-1 text-sm text-slate-500">Review tenant payments, approve or reject.</p>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Needs review {submitted.length > 0 && <span className="badge-blue ml-1">{submitted.length}</span>}</h2>
        {submitted.length === 0 ? (
          <div className="card p-8 text-center text-sm text-slate-400">No payments waiting for review.</div>
        ) : (
          <div className="space-y-4">
            {submitted.map((inv) => (
              <div key={inv.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{inv.profiles?.full_name ?? "Tenant"}</p>
                      <span className="badge-gray font-mono">{inv.invoice_number}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{inv.profiles?.email}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {shortDate(inv.period_start)} – {shortDate(inv.period_end)} · {inv.court_count} × {peso(inv.unit_price)}
                    </p>
                    <p className="mt-1 text-lg font-bold">{peso(inv.amount)}</p>
                  </div>
                  {inv.proof_url && (
                    <a href={inv.proof_url} target="_blank" rel="noreferrer" className="shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={inv.proof_url} alt="proof" className="h-28 w-28 rounded-lg border border-slate-200 object-cover" />
                      <span className="mt-1 block text-center text-xs text-[var(--color-brand)]">Open proof</span>
                    </a>
                  )}
                </div>
                <div className="mt-4">
                  <ApproveRejectButtons invoiceId={inv.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">All invoices</h2>
        <div className="card overflow-hidden">
          {invoices.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">No invoices yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Tenant</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                      <td className="px-4 py-3">{inv.profiles?.full_name ?? "—"}</td>
                      <td className="px-4 py-3 font-semibold">{peso(inv.amount)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{shortDate(inv.due_date)}</td>
                      <td className="px-4 py-3"><span className={badgeFor[inv.status] ?? "badge-gray"}>{inv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
