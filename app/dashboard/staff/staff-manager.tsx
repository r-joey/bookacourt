"use client";

import { useActionState, useTransition } from "react";
import { inviteStaff, removeStaff, type ActionState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";

type StaffRow = { profile_id: string; full_name: string | null; email: string | null };

export function StaffManager({
  venueId,
  staff,
  canInvite,
}: {
  venueId: string;
  staff: StaffRow[];
  canInvite: boolean;
}) {
  const [state, action] = useActionState<ActionState, FormData>(inviteStaff, undefined);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
        <p className="mt-1 text-sm text-slate-500">Staff can run the day for this venue — bookings, payments and walk-ins.</p>
      </div>

      {!canInvite && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> to <span className="font-mono">.env.local</span> to create staff accounts.
        </div>
      )}

      <form action={action} className="card space-y-4 p-6">
        <input type="hidden" name="venue_id" value={venueId} />
        <h2 className="font-semibold">Add a staff member</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Full name</label>
            <input name="full_name" className="input" placeholder="Staff name" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="input" placeholder="staff@email.com" required />
          </div>
          <div>
            <label className="label">Temp password</label>
            <input name="password" type="text" className="input" placeholder="min 8 characters" required />
          </div>
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Staff added. Share the login details with them.</p>}
        <SubmitButton className="btn-primary" pendingText="Adding…">Add staff</SubmitButton>
      </form>

      <div className="card divide-y divide-slate-100">
        {staff.length === 0 ? (
          <p className="p-6 text-sm text-slate-400">No staff yet.</p>
        ) : (
          staff.map((s) => (
            <div key={s.profile_id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="font-medium">{s.full_name ?? "Staff"}</p>
                <p className="text-xs text-slate-400">{s.email}</p>
              </div>
              <button
                className="btn-ghost btn-sm text-red-600"
                onClick={() => confirm("Remove this staff member from the venue?") && startTransition(() => removeStaff(venueId, s.profile_id))}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
