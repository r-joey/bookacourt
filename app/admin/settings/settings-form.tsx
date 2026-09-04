"use client";

import { useActionState } from "react";
import { updateSettings, type AdminState } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import type { Tables } from "@/lib/supabase/database.types";

export function SettingsForm({ settings }: { settings: Tables<"platform_settings"> | null }) {
  const [state, action] = useActionState<AdminState, FormData>(updateSettings, undefined);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Platform settings</h1>
      <p className="mt-1 text-sm text-slate-500">Controls billing and how tenants pay you.</p>

      <form action={action} className="mt-6 space-y-6">
        <div className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-semibold">Billing</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Price per court (₱ / month)</label>
              <input name="price_per_court" type="number" min={0} defaultValue={settings?.price_per_court ?? 100} className="input" />
              <p className="mt-1.5 text-xs text-slate-400">Charged per court created in each monthly cycle.</p>
            </div>
            <div>
              <label className="label">Invoice grace period (days)</label>
              <input name="invoice_grace_days" type="number" min={1} max={365} defaultValue={settings?.invoice_grace_days ?? 7} className="input" />
              <p className="mt-1.5 text-xs text-slate-400">Days after the period to pay before the venue is auto-suspended.</p>
            </div>
          </div>
        </div>

        <div className="card space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="font-semibold">Your payment QR (QRPH)</h2>
            <p className="mt-1 text-sm text-slate-500">Tenants scan this to pay their invoices, then upload proof for you to approve.</p>
          </div>
          <div>
            <label className="label">QR image</label>
            <ImageUpload bucket="platform" prefix="qr" name="payment_qr_url" defaultUrl={settings?.payment_qr_url} label="Upload QR" hint="PNG or JPG, up to 5 MB" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Label</label>
              <input name="payment_label" defaultValue={settings?.payment_label ?? ""} className="input" placeholder="GCash, BPI, Maya…" />
            </div>
            <div>
              <label className="label">Account name</label>
              <input name="payment_account_name" defaultValue={settings?.payment_account_name ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Account number</label>
              <input name="payment_account_number" defaultValue={settings?.payment_account_number ?? ""} className="input" />
            </div>
            <div>
              <label className="label">Note</label>
              <input name="payment_note" defaultValue={settings?.payment_note ?? ""} className="input" placeholder="e.g. include invoice number in the reference" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SubmitButton className="btn-primary" pendingText="Saving…">Save settings</SubmitButton>
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
          {state?.ok && <span className="text-sm text-emerald-600">{state.ok}</span>}
        </div>
      </form>
    </div>
  );
}
