import { getActiveVenue } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PaymentsQueue } from "./payments-queue";

export default async function PaymentsPage() {
  const venue = await getActiveVenue();
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, booking_slots(starts_at, ends_at, price, courts(name)), payment_methods(label)")
    .eq("venue_id", venue.id)
    .eq("status", "pending_payment")
    .order("created_at", { ascending: false });

  return <PaymentsQueue bookings={data ?? []} />;
}
