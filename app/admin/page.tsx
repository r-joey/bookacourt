import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { peso, shortDate } from "@/lib/format";
import { RunBillingButton, SuspendButton } from "./admin-buttons";

export default async function AdminTenantsPage() {
  const supabase = await createClient();

  const [{ data: tenants }, { data: venues }, { data: courts }, { data: invoices }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "tenant").order("created_at"),
    supabase.from("venues").select("id, owner_id"),
    supabase.from("courts").select("venue_id").is("deleted_at", null),
    supabase.from("invoices").select("tenant_id, status, amount"),
  ]);

  const venuesByOwner = new Map<string, string[]>();
  for (const v of venues ?? []) {
    const arr = venuesByOwner.get(v.owner_id) ?? [];
    arr.push(v.id);
    venuesByOwner.set(v.owner_id, arr);
  }
  const courtCountByVenue = new Map<string, number>();
  for (const c of courts ?? []) courtCountByVenue.set(c.venue_id, (courtCountByVenue.get(c.venue_id) ?? 0) + 1);

  const outstandingByTenant = new Map<string, number>();
  for (const inv of invoices ?? []) {
    if (inv.status === "pending") {
      outstandingByTenant.set(inv.tenant_id, (outstandingByTenant.get(inv.tenant_id) ?? 0) + inv.amount);
    }
  }

  const totalOutstanding = [...outstandingByTenant.values()].reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="mt-1 text-sm text-slate-500">
            {tenants?.length ?? 0} tenant{tenants?.length === 1 ? "" : "s"} · {peso(totalOutstanding)} outstanding
          </p>
        </div>
        <RunBillingButton />
      </div>

      <div className="card overflow-hidden">
        {(tenants ?? []).length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">No tenants have signed up yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Venues</th>
                  <th className="px-4 py-3 font-medium">Courts</th>
                  <th className="px-4 py-3 font-medium">Next invoice</th>
                  <th className="px-4 py-3 font-medium">Outstanding</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(tenants ?? []).map((t) => {
                  const vids = venuesByOwner.get(t.id) ?? [];
                  const courtTotal = vids.reduce((sum, vid) => sum + (courtCountByVenue.get(vid) ?? 0), 0);
                  const outstanding = outstandingByTenant.get(t.id) ?? 0;
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3">
                        <Link href={`/admin/tenants/${t.id}`} className="font-medium text-[var(--color-brand)]">
                          {t.full_name ?? "—"}
                        </Link>
                        <p className="text-xs text-slate-400">{t.email}</p>
                      </td>
                      <td className="px-4 py-3">{vids.length}</td>
                      <td className="px-4 py-3">{courtTotal}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">{t.next_invoice_date ? shortDate(t.next_invoice_date) : "—"}</td>
                      <td className="px-4 py-3">{outstanding ? <span className="font-semibold text-red-600">{peso(outstanding)}</span> : peso(0)}</td>
                      <td className="px-4 py-3">
                        {t.is_suspended ? <span className="badge-red">Suspended</span> : <span className="badge-green">Active</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <SuspendButton tenantId={t.id} suspended={t.is_suspended} />
                      </td>
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
