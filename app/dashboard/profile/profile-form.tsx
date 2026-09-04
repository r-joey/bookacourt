"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { updateVenueProfile, togglePublish, type ActionState } from "@/app/dashboard/actions";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { MultiImageUpload } from "@/components/multi-image-upload";
import { LocationPicker } from "@/components/location-picker";
import type { Venue } from "@/lib/supabase/database.types";

// Extract lat/lng from a pasted "lat, lng" string or a Google Maps URL.
function parseCoords(input: string): { lat: number; lng: number } | null {
  const s = input.trim();
  const patterns = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/, // .../data=...!3dLAT!4dLNG
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/, // .../@LAT,LNG,zoom
    /[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/, // ?q=LAT,LNG
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/, // plain "LAT, LNG"
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

export function ProfileForm({ venue }: { venue: Venue }) {
  const [state, action] = useActionState<ActionState, FormData>(updateVenueProfile, undefined);
  const [pending, startTransition] = useTransition();
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: venue.latitude,
    lng: venue.longitude,
  });
  const [mapsInput, setMapsInput] = useState("");
  const [mapsError, setMapsError] = useState("");

  function applyMaps() {
    const parsed = parseCoords(mapsInput);
    if (!parsed) {
      setMapsError("Couldn't find coordinates in that. Paste a Google Maps link or “lat, lng”.");
      return;
    }
    setMapsError("");
    setCoords(parsed);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Venue profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything here shows on <span className="font-mono">bookacourt.ph/@{venue.slug}</span>.
          </p>
        </div>
        <Link href={`/@${venue.slug}`} target="_blank" className="text-sm font-medium text-[var(--color-brand)]">
          View public page →
        </Link>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${venue.is_published ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-slate-50"}`}>
        <div>
          <p className="text-sm font-semibold">{venue.is_published ? "Your page is live" : "Your page is unpublished"}</p>
          <p className="text-sm text-slate-500">
            {venue.is_published ? "Customers can find and book at your link." : "Publish to let customers book online."}
          </p>
        </div>
        <button
          className={venue.is_published ? "btn-ghost btn-sm" : "btn-primary btn-sm"}
          disabled={pending}
          onClick={() => startTransition(() => togglePublish(venue.id, !venue.is_published))}
        >
          {venue.is_published ? "Unpublish" : "Publish"}
        </button>
      </div>

      <form action={action} className="grid gap-6 lg:grid-cols-3">
        <input type="hidden" name="venue_id" value={venue.id} />
        <input type="hidden" name="latitude" value={coords.lat ?? ""} />
        <input type="hidden" name="longitude" value={coords.lng ?? ""} />

        <div className="space-y-4 lg:col-span-2">
          <div className="card space-y-4 p-5 sm:p-6">
            <div>
              <label className="label">Venue name</label>
              <input name="name" defaultValue={venue.name} className="input" required />
            </div>
            <div>
              <label className="label">Handle</label>
              <div className="flex items-center rounded-lg border border-slate-300 focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-blue-100">
                <span className="pl-3 text-sm text-slate-400">bookacourt.ph/@</span>
                <input name="slug" defaultValue={venue.slug} className="w-full border-0 bg-transparent px-1 py-2 text-sm outline-none" required />
              </div>
              <p className="mt-1 text-xs text-slate-400">Changing this changes your public link. Old links will stop working.</p>
            </div>
            <div>
              <label className="label">Short description</label>
              <textarea name="description" defaultValue={venue.description ?? ""} rows={3} className="input resize-y" />
            </div>
            <div>
              <label className="label">Address</label>
              <input name="address" defaultValue={venue.address ?? ""} className="input" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Contact number</label>
                <input name="contact_number" defaultValue={venue.contact_number ?? ""} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input name="email" defaultValue={venue.email ?? ""} className="input" />
              </div>
              <div>
                <label className="label">Facebook</label>
                <input name="facebook" defaultValue={venue.facebook ?? ""} className="input" placeholder="https://…" />
              </div>
              <div>
                <label className="label">Instagram</label>
                <input name="instagram" defaultValue={venue.instagram ?? ""} className="input" placeholder="https://…" />
              </div>
            </div>
            <div>
              <label className="label">Amenities (comma separated)</label>
              <input name="amenities" defaultValue={venue.amenities.join(", ")} className="input" placeholder="Air-conditioned, Shower rooms, Free parking" />
            </div>
          </div>

          <div className="card space-y-3 p-5 sm:p-6">
            <div>
              <label className="label">Banner images (up to 5)</label>
              <MultiImageUpload bucket="logos" prefix={venue.id} name="banner_urls" defaultUrls={venue.banner_urls} max={5} hint="Shown as a carousel at the top of your public page. Drag order with the arrows." />
            </div>
          </div>

          <div className="card space-y-3 p-5 sm:p-6">
            <div className="flex items-center gap-1.5">
              <label className="label !mb-0">Location on map</label>
              <span className="group relative">
                <span className="grid h-4 w-4 cursor-help place-items-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-500">?</span>
                <span className="pointer-events-none absolute left-1/2 top-6 z-10 w-64 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  Open your venue in Google Maps, tap Share → Copy link (or copy the URL from the address bar), and paste it below. You can also paste plain “latitude, longitude”.
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input"
                placeholder="Paste Google Maps link or 14.6386, 121.0765"
                value={mapsInput}
                onChange={(e) => setMapsInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyMaps(); } }}
              />
              <button type="button" className="btn-ghost shrink-0" onClick={applyMaps}>Set pin</button>
            </div>
            {mapsError && <p className="text-xs text-red-600">{mapsError}</p>}
            <LocationPicker lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 sm:p-6">
            <label className="label">Logo</label>
            <ImageUpload bucket="logos" prefix={venue.id} name="logo_url" defaultUrl={venue.logo_url} label="Choose file" />
          </div>

          <div className="card p-5 sm:p-6">
            <SubmitButton className="btn-primary w-full" pendingText="Saving…">Save changes</SubmitButton>
            {state?.ok && <p className="mt-2 text-center text-sm text-emerald-600">Saved.</p>}
            {state?.error && <p className="mt-2 text-center text-sm text-red-600">{state.error}</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
