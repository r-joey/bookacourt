import { getActiveVenue } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { HoursForm } from "./hours-form";

export default async function HoursPage() {
  const venue = await getActiveVenue();
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;

  const supabase = await createClient();
  const { data: hours } = await supabase
    .from("venue_hours")
    .select("*")
    .eq("venue_id", venue.id)
    .order("weekday");

  return <HoursForm venueId={venue.id} hours={hours ?? []} />;
}
