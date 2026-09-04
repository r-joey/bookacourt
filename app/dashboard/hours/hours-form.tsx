"use client";

import { useActionState } from "react";
import { saveHours, type ActionState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import { WEEKDAYS } from "@/lib/constants";
import type { VenueHours } from "@/lib/supabase/database.types";

export function HoursForm({ venueId, hours }: { venueId: string; hours: VenueHours[] }) {
  const [state, action] = useActionState<ActionState, FormData>(saveHours, undefined);
  const byDay = new Map(hours.map((h) => [h.weekday, h]));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Operating hours</h1>
      <p className="mt-1 text-sm text-slate-500">Bookable slots are generated from these hours, one per hour.</p>

      <form action={action} className="card mt-6 divide-y divide-slate-100">
        <input type="hidden" name="venue_id" value={venueId} />
        {WEEKDAYS.map((day, weekday) => {
          const h = byDay.get(weekday);
          const open = (h?.opens ?? "06:00").slice(0, 5);
          const close = (h?.closes ?? "23:00").slice(0, 5);
          const closed = h?.is_closed ?? false;
          return (
            <div key={weekday} className="grid grid-cols-2 items-center gap-3 px-5 py-3 sm:grid-cols-4">
              <span className="font-medium">{day}</span>
              <input type="time" name={`open_${weekday}`} defaultValue={open} className="input" />
              <input type="time" name={`close_${weekday}`} defaultValue={close} className="input" />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" name={`closed_${weekday}`} defaultChecked={closed} /> Closed
              </label>
            </div>
          );
        })}
        <div className="flex items-center gap-3 px-5 py-4">
          <SubmitButton className="btn-primary" pendingText="Saving…">Save hours</SubmitButton>
          {state?.ok && <span className="text-sm text-emerald-600">Saved.</span>}
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
        </div>
      </form>
    </div>
  );
}
