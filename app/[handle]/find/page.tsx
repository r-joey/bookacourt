import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VenueBookingHeader } from "@/components/venue-booking-header";
import { FindBooking } from "./find-booking";

function slugFromHandle(handle: string) {
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith("@") ? decoded.slice(1) : null;
}

export default async function FindPage({
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
    .select("name, slug, logo_url, sport")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!venue) notFound();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-4 py-8 sm:px-5 sm:py-10">
        <VenueBookingHeader slug={venue.slug} name={venue.name} logoUrl={venue.logo_url} sport={venue.sport} />
        <FindBooking />
      </div>
    </div>
  );
}
