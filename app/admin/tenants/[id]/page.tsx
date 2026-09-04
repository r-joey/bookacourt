import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { peso, shortDate } from "@/lib/format";
import { SuspendButton, MarkPaidButton, ApproveRejectButtons } from "@/app/admin/admin-buttons";

const badgeFor: Record<string, string> = {
  pending: "badge-amber",
  submitted: "badge-blue",
  overdue: "badge-red",
  paid: "badge-green",
  void: "badge-gray",
};

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (!tenant) notFound();

  const [{ data: venues }, { data: invoices }, { data: events }] = await Promise.all([
    supabase.from("venues").select("id, name, slug, is_published, created_at").eq("owner_id", id).order("created_at"),
    supabase.from("invoices").select("*").eq("tenant_id", id).order("created_at", { ascending: false }),
    supabase.from("court_creation_events").select("court_name, venue_name, created_at").eq("tenant_id", id).order("created_at", { ascending: false }),
  ]);

  const courtCounts = new Map<string, number>();
  const { data: courts } = await supabase
    .from("courts")
    .select("venue_id")
    .in("venue_id", (venues ?? []).map((v) => v.id).length ? (venues ?? []).map((v) => v.id) : ["00000000-0000-0000-0000-000000000000"])
    .is("deleted_at", null);
  for (const c of courts ?? []) courtCounts.set(c.venue_id, (courtCounts.get(c.venue_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-[var(--color-brand)]">← All tenants</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tenant.full_name ?? "Tenant"}</h1>
          <p className="text-sm text-slate-500">{tenant.email} · joined {shortDate(tenant.created_at)}</p>
          <div className="mt-2">
            {tenant.is_suspended ? <span className="badge-red">Suspended</span> : <span className="badge-green">Active</span>}
          </div>
        </div>
        <SuspendButton tenantId={tenant.id} suspended={tenant.is_suspended} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Billing cycle</p>
          <p className="mt-2 text-sm text-slate-600">
            {tenant.billing_start_date ? shortDate(tenant.billing_start_date) : "—"} · next {tenant.next_invoice_date ? shortDate(tenant.next_invoice_date) : "—"}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Venues</p>
          <p className="mt-2 text-3xl font-bold">{venues?.length ?? 0}</p>
        </div>
        <div className="card p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Court creations (all time)</p>
          <p className="mt-2 text-3xl font-bold">{events?.length ?? 0}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Venues</h2>
        <div className="card divide-y divide-slate-100">
          {(venues ?? []).length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No venues.</p>
          ) : (
            (venues ?? []).map((v) => (
              <div key={v.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-medium">{v.name}</p>
                  <p className="font-mono text-xs text-slate-400">@{v.slug} · {courtCounts.get(v.id) ?? 0} courts</p>
                </div>
                {v.is_published ? <span className="badge-green">Live</span> : <span className="badge-gray">Unpublished</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">Invoices</h2>
        <div className="card overflow-hidden">
          {(invoices ?? []).length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No invoices yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Courts</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(invoices ?? []).map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">{shortDate(inv.period_start)} – {shortDate(inv.period_end)}</td>
                    <td className="px-4 py-3">{inv.court_count} × {peso(inv.unit_price)}</td>
                    <td className="px-4 py-3 font-semibold">{peso(inv.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={badgeFor[inv.status]}>{inv.status}</span>
                      {inv.proof_url && (
                        <a href={inv.proof_url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-[var(--color-brand)]">proof</a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {inv.status === "submitted" ? (
                        <ApproveRejectButtons invoiceId={inv.id} />
                      ) : (
                        <MarkPaidButton invoiceId={inv.id} paid={inv.status === "paid"} />
                      )}
                    </td>
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
