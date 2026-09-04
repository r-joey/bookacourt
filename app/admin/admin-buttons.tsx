"use client";

import { useState, useTransition } from "react";
import { setSuspended, markInvoicePaid, runBilling, approveInvoice, rejectInvoice } from "./actions";

export function RunBillingButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-sm text-slate-500">{msg}</span>}
      <button
        className="btn-ghost btn-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await runBilling();
            setMsg(res?.error ?? res?.ok ?? "");
          })
        }
      >
        {pending ? "Running…" : "Run billing now"}
      </button>
    </div>
  );
}

export function SuspendButton({ tenantId, suspended }: { tenantId: string; suspended: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className={`btn-sm ${suspended ? "btn-primary" : "btn-ghost text-red-600"}`}
      disabled={pending}
      onClick={() => startTransition(() => setSuspended(tenantId, !suspended))}
    >
      {suspended ? "Unsuspend" : "Suspend"}
    </button>
  );
}

export function MarkPaidButton({ invoiceId, paid }: { invoiceId: string; paid: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="btn-ghost btn-sm"
      disabled={pending}
      onClick={() => startTransition(() => markInvoicePaid(invoiceId, !paid))}
    >
      {paid ? "Mark unpaid" : "Mark paid"}
    </button>
  );
}

export function ApproveRejectButtons({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-2">
      <button className="btn-primary btn-sm" disabled={pending} onClick={() => startTransition(() => approveInvoice(invoiceId))}>
        Approve
      </button>
      <button
        className="btn-ghost btn-sm text-red-600"
        disabled={pending}
        onClick={() => confirm("Reject this payment? The tenant will need to pay again.") && startTransition(() => rejectInvoice(invoiceId))}
      >
        Reject
      </button>
    </div>
  );
}
