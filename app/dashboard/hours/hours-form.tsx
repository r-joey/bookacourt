"use client";

import { useActionState, useState } from "react";
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
          return (
            <DayRow
              key={weekday}
              day={day}
              weekday={weekday}
              open={(h?.opens ?? "06:00").slice(0, 5)}
              close={(h?.closes ?? "23:00").slice(0, 5)}
              closed={h?.is_closed ?? false}
            />
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

function DayRow({ day, weekday, open, close, closed: initialClosed }: {
  day: string; weekday: number; open: string; close: string; closed: boolean;
}) {
  const [closed, setClosed] = useState(initialClosed);
  const timeClass = "input disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";
  return (
    <div className="grid grid-cols-2 items-center gap-3 px-5 py-3 sm:grid-cols-4">
      <span className={`font-medium ${closed ? "text-slate-400" : ""}`}>{day}</span>
      <input type="time" name={`open_${weekday}`} defaultValue={open} className={timeClass} disabled={closed} aria-label={`${day} opening time`} />
      <input type="time" name={`close_${weekday}`} defaultValue={close} className={timeClass} disabled={closed} aria-label={`${day} closing time`} />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name={`closed_${weekday}`}
          defaultChecked={initialClosed}
          onChange={(e) => setClosed(e.target.checked)}
        />{" "}
        Closed
      </label>
    </div>
  );
}
