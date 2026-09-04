import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SPORT_EMOJI } from "@/lib/constants";
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
        <div className="mb-6">
          <Link href={`/@${venue.slug}`} className="group inline-flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-blue-50 text-xl">
              {venue.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={venue.logo_url} alt={venue.name} className="h-full w-full object-cover" />
              ) : (
                SPORT_EMOJI[venue.sport] ?? "🏟️"
              )}
            </span>
            <span>
              <span className="block text-xl font-bold tracking-tight group-hover:underline">{venue.name}</span>
              <span className="block text-sm text-slate-500">Book a court</span>
            </span>
          </Link>
        </div>

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
