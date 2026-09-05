"use client";

import { useActionState, useState, useTransition } from "react";
import { createCourt, updateCourt, deleteCourt, type ActionState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import { SPORTS } from "@/lib/constants";
import { peso } from "@/lib/format";
import type { Court } from "@/lib/supabase/database.types";

export function CourtsManager({
  venueId,
  defaultSport,
  courts,
  pricePerCourt,
}: {
  venueId: string;
  defaultSport: string;
  courts: Court[];
  pricePerCourt: number;
}) {
  const [state, action] = useActionState<ActionState, FormData>(createCourt, undefined);
  const [showAdd, setShowAdd] = useState(courts.length === 0);
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courts</h1>
          <p className="mt-1 text-sm text-slate-500">Each court can have its own sport and hourly price.</p>
        </div>
        {!showAdd && (
          <button className="btn-primary" onClick={() => setShowAdd(true)}>＋ Add court</button>
        )}
      </div>

      {/* Billing notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>Heads up on billing.</strong> You’re charged{" "}
        <strong>{peso(pricePerCourt)} per active court, every month</strong>. Adding a court raises your
        monthly bill; deleting one lowers it from your next cycle.
      </div>

      {showAdd && (
        <form
          action={action}
          className="card space-y-4 p-6"
          onSubmit={() => setAcknowledged(false)}
        >
          <input type="hidden" name="venue_id" value={venueId} />
          <h2 className="font-semibold">New court</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label">Name</label>
              <input name="name" className="input" placeholder="Court 1" maxLength={32} required />
              <p className="mt-1 text-xs text-slate-400">Up to 32 characters. The sport tag tells customers the type.</p>
            </div>
            <div>
              <label className="label">Sport</label>
              <select name="sport" className="input" defaultValue={defaultSport}>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Price / hour (₱)</label>
              <input name="hourly_price" type="number" min={0} className="input" placeholder="250" required />
            </div>
          </div>

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" className="mt-0.5" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
            I understand this court adds {peso(pricePerCourt)} to my bill every month while it’s active.
          </label>

          {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

          <div className="flex gap-2">
            <SubmitButtonGuarded disabled={!acknowledged} />
            {courts.length > 0 && (
              <button type="button" className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-3">
        {courts.length === 0 && !showAdd && (
          <p className="text-sm text-slate-400">No courts yet.</p>
        )}
        {courts.map((court) => (
          <CourtRow key={court.id} court={court} />
        ))}
      </div>
    </div>
  );
}

function SubmitButtonGuarded({ disabled }: { disabled: boolean }) {
  // Keep pending state from useFormStatus but also disable until acknowledged.
  return (
    <span className={disabled ? "pointer-events-none opacity-50" : ""}>
      <SubmitButton className="btn-primary" pendingText="Adding…">Add court</SubmitButton>
    </span>
  );
}

function CourtRow({ court }: { court: Court }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <div className="card flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${court.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />
          <div>
            <p className="font-medium">{court.name}</p>
            <p className="text-xs text-slate-400">{court.sport} · {peso(court.hourly_price)}/hr {court.is_active ? "" : "· inactive"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          <button
            className="btn-ghost btn-sm text-red-600"
            disabled={pending}
            onClick={() => {
              if (confirm(`Remove ${court.name}? It stops adding to your monthly bill from your next cycle.`)) {
                startTransition(() => deleteCourt(court.id));
              }
            }}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={updateCourt} className="card p-4" onSubmit={() => setEditing(false)}>
      <input type="hidden" name="id" value={court.id} />
      <div className="grid items-end gap-3 sm:grid-cols-4">
        <div>
          <label className="label">Name</label>
          <input name="name" defaultValue={court.name} className="input" maxLength={32} required />
        </div>
        <div>
          <label className="label">Sport</label>
          <select name="sport" defaultValue={court.sport} className="input">
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Price / hour</label>
          <input name="hourly_price" type="number" min={0} defaultValue={court.hourly_price} className="input" required />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={court.is_active} /> Active
        </label>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="submit" className="btn-primary btn-sm">Save</button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </form>
  );
}
