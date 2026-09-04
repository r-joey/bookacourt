import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VenueMap } from "@/components/venue-map";
import { BannerCarousel } from "@/components/banner-carousel";
import { SPORT_EMOJI, WEEKDAYS } from "@/lib/constants";

function slugFromHandle(handle: string) {
  const decoded = decodeURIComponent(handle);
  return decoded.startsWith("@") ? decoded.slice(1) : null;
}

export default async function VenuePublicPage({
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
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!venue) notFound();

  const { data: hours } = await supabase
    .from("venue_hours")
    .select("*")
    .eq("venue_id", venue.id)
    .order("weekday");

  const byDay = new Map((hours ?? []).map((h) => [h.weekday, h]));
  const fmt = (t: string) => {
    const h = parseInt(t, 10);
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:00 ${h < 12 ? "AM" : "PM"}`;
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-5 sm:py-8">
        {venue.banner_urls.length > 0 && (
          <div className="mb-6">
            <BannerCarousel images={venue.banner_urls} />
          </div>
        )}

        {/* Hero */}
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-blue-50 text-2xl sm:h-16 sm:w-16">
            {venue.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={venue.logo_url} alt={venue.name} className="h-full w-full object-cover" />
            ) : (
              SPORT_EMOJI[venue.sport] ?? "🏟️"
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{venue.name}</h1>
            <p className="font-mono text-sm text-slate-400">bookacourt.ph/@{venue.slug}</p>
          </div>
        </div>

        {venue.description && <p className="mt-5 leading-relaxed text-slate-600">{venue.description}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/@${venue.slug}/book`} className="btn-primary">Book a court</Link>
          <Link href={`/@${venue.slug}/find`} className="btn-ghost">Find my booking</Link>
        </div>

        {venue.amenities.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {venue.amenities.map((a) => (
              <span key={a} className="badge-gray">{a}</span>
            ))}
          </div>
        )}

        <hr className="my-8 border-slate-200" />

        <div className="grid gap-8 sm:grid-cols-2">
          {/* Location */}
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-brand)]">Where to find us</h2>
            {venue.latitude != null && venue.longitude != null ? (
              <VenueMap lat={venue.latitude} lng={venue.longitude} />
            ) : (
              <div className="grid h-40 place-items-center rounded-lg border border-dashed border-slate-200 text-sm text-slate-400">
                Location not set
              </div>
            )}
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-slate-600">{venue.address}</span>
              {venue.latitude != null && (
                <a
                  className="font-medium text-[var(--color-brand)]"
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`}
                >
                  Open in Google Maps
                </a>
              )}
            </div>
          </div>

          {/* Hours */}
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-brand)]">Operating hours</h2>
            <ul className="divide-y divide-slate-100 text-sm">
              {WEEKDAYS.map((day, wd) => {
                const h = byDay.get(wd);
                return (
                  <li key={wd} className="flex justify-between py-2">
                    <span className="text-slate-600">{day}</span>
                    <span className="font-medium">
                      {!h || h.is_closed ? "Closed" : `${fmt(h.opens)} – ${fmt(h.closes)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {(venue.contact_number || venue.email || venue.facebook || venue.instagram) && (
          <>
            <hr className="my-8 border-slate-200" />
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-brand)]">Contact</h2>
            <div className="space-y-1 text-sm text-slate-600">
              {venue.contact_number && <p>{venue.contact_number}</p>}
              {venue.email && <p>{venue.email}</p>}
              {venue.facebook && <a href={venue.facebook} className="block text-[var(--color-brand)]">Facebook</a>}
              {venue.instagram && <a href={venue.instagram} className="block text-[var(--color-brand)]">Instagram</a>}
            </div>
          </>
        )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          Powered by BookaCourt
        </footer>
      </div>
    </div>
  );
}
