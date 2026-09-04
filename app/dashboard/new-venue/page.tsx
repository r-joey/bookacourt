"use client";

import { useActionState } from "react";
import { createVenue, type ActionState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import { SPORTS } from "@/lib/constants";

export default function NewVenuePage() {
  const [state, action] = useActionState<ActionState, FormData>(createVenue, undefined);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Create a venue</h1>
      <p className="mt-1 text-sm text-slate-500">
        You can add courts, hours and payment details next.
      </p>

      <form action={action} className="card mt-6 space-y-4 p-6">
        <div>
          <label className="label" htmlFor="name">Venue name</label>
          <input id="name" name="name" className="input" placeholder="e.g. Paddle Ground" required />
        </div>
        <div>
          <label className="label" htmlFor="sport">Main sport</label>
          <select id="sport" name="sport" className="input" defaultValue="Badminton">
            {SPORTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
        )}

        <SubmitButton className="btn-primary" pendingText="Creating…">Create venue</SubmitButton>
      </form>
    </div>
  );
}
