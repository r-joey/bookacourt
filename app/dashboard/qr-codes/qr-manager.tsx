"use client";

import { useActionState, useState, useTransition } from "react";
import {
  createPaymentMethod,
  togglePaymentMethod,
  deletePaymentMethod,
  type ActionState,
} from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import type { PaymentMethod } from "@/lib/supabase/database.types";

export function QrManager({ venueId, methods }: { venueId: string; methods: PaymentMethod[] }) {
  const [state, action] = useActionState<ActionState, FormData>(createPaymentMethod, undefined);
  const [showAdd, setShowAdd] = useState(methods.length === 0);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment QR codes</h1>
          <p className="mt-1 text-sm text-slate-500">Customers scan these to pay, then upload their receipt.</p>
        </div>
        {!showAdd && <button className="btn-primary" onClick={() => setShowAdd(true)}>＋ Add QR</button>}
      </div>

      {showAdd && (
        <form action={action} className="card space-y-4 p-6" key={state?.ok ? "reset" : "form"}>
          <input type="hidden" name="venue_id" value={venueId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Label</label>
              <input name="label" className="input" placeholder="BPI, GCash, Maya…" required />
            </div>
            <div>
              <label className="label">Account name (optional)</label>
              <input name="account_name" className="input" placeholder="Juan Dela Cruz" />
            </div>
            <div>
              <label className="label">Account number (optional)</label>
              <input name="account_number" className="input" placeholder="•••• 1234" />
            </div>
            <div>
              <label className="label">Note (optional)</label>
              <input name="note" className="input" placeholder="Transfer fees may apply" />
            </div>
          </div>
          <div>
            <label className="label">QR image</label>
            <ImageUpload bucket="payment-qr" prefix={venueId} name="qr_url" label="Upload QR" hint="PNG or JPG, up to 5 MB" />
          </div>

          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

          <div className="flex gap-2">
            <SubmitButton className="btn-primary" pendingText="Saving…">Save QR</SubmitButton>
            {methods.length > 0 && <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>}
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((m) => (
          <div key={m.id} className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
              <span className="font-semibold">{m.label}</span>
              <span className={m.is_active ? "badge-green" : "badge-gray"}>{m.is_active ? "Active" : "Off"}</span>
            </div>
            {m.qr_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.qr_url} alt={m.label} className="mx-auto my-4 h-40 w-40 rounded-lg border border-slate-100 object-contain" />
            )}
            <div className="px-4 pb-2 text-xs text-slate-500">
              {m.account_name && <p>{m.account_name}</p>}
              {m.account_number && <p>{m.account_number}</p>}
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-4 py-2.5">
              <button className="btn-ghost btn-sm flex-1" onClick={() => startTransition(() => togglePaymentMethod(m.id, !m.is_active))}>
                {m.is_active ? "Turn off" : "Turn on"}
              </button>
              <button
                className="btn-ghost btn-sm text-red-600"
                onClick={() => confirm(`Delete ${m.label}?`) && startTransition(() => deletePaymentMethod(m.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
