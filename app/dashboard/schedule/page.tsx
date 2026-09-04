import { getActiveVenue } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ScheduleView } from "./schedule-view";

export default async function SchedulePage() {
  const venue = await getActiveVenue();
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;

  const supabase = await createClient();
  const [{ data: courts }, { data: hours }] = await Promise.all([
    supabase.from("courts").select("id, name, hourly_price, sport").eq("venue_id", venue.id).is("deleted_at", null).eq("is_active", true).order("sort_order").order("created_at"),
    supabase.from("venue_hours").select("weekday, opens, closes, is_closed").eq("venue_id", venue.id),
  ]);

  return <ScheduleView venueId={venue.id} courts={courts ?? []} hours={hours ?? []} />;
}
