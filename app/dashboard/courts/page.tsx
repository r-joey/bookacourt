import { getActiveVenue } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CourtsManager } from "./courts-manager";

export default async function CourtsPage() {
  const venue = await getActiveVenue();
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;

  const supabase = await createClient();
  const [{ data: courts }, { data: settings }] = await Promise.all([
    supabase
      .from("courts")
      .select("*")
      .eq("venue_id", venue.id)
      .is("deleted_at", null)
      .order("created_at"),
    supabase.from("platform_settings").select("price_per_court").maybeSingle(),
  ]);

  return (
    <CourtsManager
      venueId={venue.id}
      defaultSport={venue.sport}
      courts={courts ?? []}
      pricePerCourt={settings?.price_per_court ?? 100}
    />
  );
}
