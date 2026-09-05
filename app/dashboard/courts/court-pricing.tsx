"use client";

import { useActionState, useTransition } from "react";
import { createPricingRule, deletePricingRule, type ActionState } from "@/app/dashboard/actions";
import { peso, hourLabel } from "@/lib/format";
import type { CourtPricingRule } from "@/lib/supabase/database.types";

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function daysLabel(days: number[]) {
  const s = [...new Set(days)].sort((a, b) => a - b);
  if (s.length === 7) return "Every day";
  if (s.length === 5 && [1, 2, 3, 4, 5].every((d) => s.includes(d))) return "Weekdays";
  if (s.length === 2 && s.includes(0) && s.includes(6)) return "Weekends";
  return s.map((d) => FULL[d]).join(", ");
}

export function CourtPricing({
  venueId,
  courtId,
  basePrice,
  rules,
}: {
  venueId: string;
  courtId: string;
  basePrice: number;
  rules: CourtPricingRule[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(createPricingRule, undefined);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Peak / custom pricing</p>

      {rules.length === 0 ? (
        <p className="mt-1 text-xs text-slate-400">No custom pricing — base {peso(basePrice)}/hr applies all week.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {rules.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span>
                <span className="font-semibold">{peso(r.price)}</span>
                <span className="text-slate-500"> · {daysLabel(r.days)} · {hourLabel(r.start_hour)} – {hourLabel(r.end_hour)}</span>
              </span>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                disabled={pending}
                onClick={() => startTransition(() => deletePricingRule(r.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form key={rules.length} action={action} className="mt-3 space-y-3 rounded-lg border border-slate-200 p-3">
        <input type="hidden" name="court_id" value={courtId} />
        <input type="hidden" name="venue_id" value={venueId} />

        <div className="flex flex-wrap items-center gap-1.5">
          {DOW.map((d, i) => (
            <label key={i} className="cursor-pointer">
              <input type="checkbox" name="days" value={i} className="peer sr-only" />
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-xs font-medium text-slate-600 transition peer-checked:border-[var(--color-brand)] peer-checked:bg-blue-50 peer-checked:text-[var(--color-brand)]">
                {d}
              </span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">From</span>
            <select name="start_hour" defaultValue={18} className="input w-32 py-1.5">
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{hourLabel(h)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">To</span>
            <select name="end_hour" defaultValue={22} className="input w-32 py-1.5">
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h + 1} value={h + 1}>{hourLabel(h + 1)}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-500">Price ₱</span>
            <input name="price" type="number" min={0} defaultValue={basePrice} className="input w-24 py-1.5" required />
          </div>
          <button type="submit" className="btn-primary btn-sm">Add rule</button>
        </div>

        {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
