import { getActiveVenue } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { QrManager } from "./qr-manager";

export default async function QrCodesPage() {
  const venue = await getActiveVenue();
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;

  const supabase = await createClient();
  const { data: methods } = await supabase
    .from("payment_methods")
    .select("*")
    .eq("venue_id", venue.id)
    .order("created_at");

  return <QrManager venueId={venue.id} methods={methods ?? []} />;
}
