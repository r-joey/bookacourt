import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VenueBookingHeader } from "@/components/venue-booking-header";
import { BookingFlow } from "./booking-flow";

function slugFromHandle(handle: string) {
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith("@") ? decoded.slice(1) : null;
}

export default async function BookPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const slug = slugFromHandle(handle);
  if (!slug) notFound();

  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name, slug, sport, logo_url, is_published")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!venue) notFound();

  const [{ data: courts }, { data: hours }, { data: methods }] = await Promise.all([
    supabase.from("courts").select("id, name, hourly_price, sport").eq("venue_id", venue.id).is("deleted_at", null).eq("is_active", true).order("sort_order").order("created_at"),
    supabase.from("venue_hours").select("weekday, opens, closes, is_closed").eq("venue_id", venue.id),
    supabase.from("payment_methods").select("id, label, qr_url, account_name, account_number, note").eq("venue_id", venue.id).eq("is_active", true).not("qr_url", "is", null).order("sort_order"),
  ]);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
        <VenueBookingHeader slug={venue.slug} name={venue.name} logoUrl={venue.logo_url} sport={venue.sport} />

        <BookingFlow
          venueId={venue.id}
          venueSlug={venue.slug}
          courts={courts ?? []}
          hours={hours ?? []}
          methods={methods ?? []}
        />
      </div>
    </div>
  );
}
