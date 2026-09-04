"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { error?: string; ok?: string } | undefined;

export async function setSuspended(tenantId: string, suspended: boolean) {
  const supabase = await createClient();
  await supabase.from("profiles").update({ is_suspended: suspended }).eq("id", tenantId);
  revalidatePath("/admin", "layout");
}

// Owner approves a submitted (or pending) invoice → paid. Auto-unsuspends the
// tenant if they have no other unpaid invoices.
export async function approveInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data: inv } = await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", invoiceId)
    .select("tenant_id")
    .single();

  if (inv?.tenant_id) {
    const { count } = await supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", inv.tenant_id)
      .in("status", ["pending", "overdue", "submitted"]);
    if ((count ?? 0) === 0) {
      await supabase.from("profiles").update({ is_suspended: false }).eq("id", inv.tenant_id);
    }
  }
  revalidatePath("/admin", "layout");
}

// Owner rejects a submitted invoice → back to pending for the tenant to redo.
export async function rejectInvoice(invoiceId: string) {
  const supabase = await createClient();
  await supabase
    .from("invoices")
    .update({ status: "pending", proof_url: null, submitted_at: null })
    .eq("id", invoiceId);
  revalidatePath("/admin", "layout");
}

// Back-compat: owner toggles paid/unpaid directly.
export async function markInvoicePaid(invoiceId: string, paid: boolean) {
  if (paid) return approveInvoice(invoiceId);
  const supabase = await createClient();
  await supabase.from("invoices").update({ status: "pending", paid_at: null }).eq("id", invoiceId);
  revalidatePath("/admin", "layout");
}

export async function updateSettings(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const price = z.coerce.number().int().min(0).safeParse(formData.get("price_per_court"));
  const grace = z.coerce.number().int().min(1).max(365).safeParse(formData.get("invoice_grace_days"));
  if (!price.success) return { error: "Enter a valid price per court." };
  if (!grace.success) return { error: "Enter a valid number of grace days (1–365)." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({
      price_per_court: price.data,
      invoice_grace_days: grace.data,
      payment_label: String(formData.get("payment_label") ?? "").trim() || null,
      payment_account_name: String(formData.get("payment_account_name") ?? "").trim() || null,
      payment_account_number: String(formData.get("payment_account_number") ?? "").trim() || null,
      payment_note: String(formData.get("payment_note") ?? "").trim() || null,
      payment_qr_url: String(formData.get("payment_qr_url") ?? "").trim() || null,
    })
    .eq("id", true);
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: "Settings saved." };
}

export async function runBilling(): Promise<AdminState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_generate_invoices");
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: `Generated ${data ?? 0} invoice period(s).` };
}
