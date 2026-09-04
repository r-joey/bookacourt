"use client";

import { useTransition } from "react";
import { confirmBooking, cancelBooking, completeBooking } from "@/app/dashboard/actions";

export function RowActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-end gap-1.5">
      {status === "pending_payment" && (
        <button className="btn-ghost btn-sm" disabled={pending} onClick={() => startTransition(() => confirmBooking(id))}>
          Confirm
        </button>
      )}
      {status === "confirmed" && (
        <button className="btn-ghost btn-sm" disabled={pending} onClick={() => startTransition(() => completeBooking(id))}>
          Complete
        </button>
      )}
      {(status === "pending_payment" || status === "confirmed") && (
        <button
          className="btn-ghost btn-sm text-red-600"
          disabled={pending}
          onClick={() => confirm("Cancel this booking?") && startTransition(() => cancelBooking(id))}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
