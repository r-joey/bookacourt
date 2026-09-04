"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { peso } from "@/lib/format";

type Payment = {
  payment_qr_url: string | null;
  payment_label: string | null;
  payment_account_name: string | null;
  payment_account_number: string | null;
  payment_note: string | null;
};

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  proof_url: string | null;
};

export function InvoicePayPanel({ invoice, payment }: { invoice: Invoice; payment: Payment | null }) {
  const router = useRouter();
  const [proofUrl, setProofUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (invoice.status === "submitted") {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Payment submitted for <span className="font-mono">{invoice.invoice_number}</span> — waiting for approval.
      </div>
    );
  }
  if (invoice.status === "paid") return null;

  async function uploadProof(file: File) {
    if (file.size > 5 * 1024 * 1024) { setError("File must be under 5 MB."); return; }
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `invoice-${invoice.id}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) throw upErr;
      setProofUrl(supabase.storage.from("payment-proofs").getPublicUrl(path).data.publicUrl);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!proofUrl) { setError("Please upload your proof of payment."); return; }
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: rpcErr } = await supabase.rpc("submit_invoice_payment", {
      p_invoice_id: invoice.id,
      p_proof_url: proofUrl,
    });
    setBusy(false);
    if (rpcErr) { setError(rpcErr.message); return; }
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      {!payment?.payment_qr_url ? (
        <p className="text-sm text-amber-700">
          The platform hasn’t set up a payment QR yet. Please contact support to settle this invoice.
        </p>
      ) : (
        <>
          <p className="text-sm font-semibold">Pay {peso(invoice.amount)} to settle this invoice</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payment.payment_qr_url} alt="Payment QR" className="h-40 w-40 shrink-0 rounded-lg border border-slate-200 bg-white object-contain p-1" />
            <div className="text-sm text-slate-600">
              <p>Scan with your banking app and send exactly <strong>{peso(invoice.amount)}</strong>.</p>
              {payment.payment_label && <p className="mt-2 font-medium">{payment.payment_label}</p>}
              {payment.payment_account_name && <p>{payment.payment_account_name}</p>}
              {payment.payment_account_number && <p>{payment.payment_account_number}</p>}
              {payment.payment_note && <p className="mt-1 text-xs text-slate-400">{payment.payment_note}</p>}
            </div>
          </div>

          <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center hover:bg-slate-50">
            {proofUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofUrl} alt="proof" className="h-20 rounded" />
            ) : (
              <>
                <span className="text-sm font-medium">{busy ? "Uploading…" : "Upload proof of payment"}</span>
                <span className="text-xs text-slate-400">JPG or PNG, up to 5 MB</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadProof(e.target.files[0])} />
          </label>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <button className="btn-primary mt-3" disabled={busy || !proofUrl} onClick={submit}>
            {busy ? "Submitting…" : "Submit payment"}
          </button>
        </>
      )}
    </div>
  );
}
