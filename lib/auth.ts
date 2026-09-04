import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Profile, Venue } from "./supabase/database.types";

// Cached per-request so multiple components share one lookup.
export const getSessionUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getSessionUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});

// Require a signed-in user; redirect to /login otherwise.
export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

// Require a tenant or staff (dashboard access). Platform admins go to /admin.
export async function requireTenant() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.is_suspended) redirect("/suspended");
  if (profile.role === "platform_admin") redirect("/admin");
  return profile;
}

export async function requirePlatformAdmin() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "platform_admin") redirect("/dashboard");
  return profile;
}

// All venues the current user can operate (owned + staffed).
export const getMyVenues = cache(async (): Promise<Venue[]> => {
  const user = await getSessionUser();
  if (!user) return [];
  const supabase = await createClient();

  const [owned, staffed] = await Promise.all([
    supabase.from("venues").select("*").eq("owner_id", user.id),
    supabase
      .from("venue_staff")
      .select("venues(*)")
      .eq("profile_id", user.id),
  ]);

  const map = new Map<string, Venue>();
  for (const v of owned.data ?? []) map.set(v.id, v);
  for (const row of staffed.data ?? []) {
    const v = (row as { venues: Venue | null }).venues;
    if (v) map.set(v.id, v);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
});

// Resolve the "active" venue for the dashboard from the cookie, falling back
// to the first venue the user has.
export async function getActiveVenue(): Promise<Venue | null> {
  const venues = await getMyVenues();
  if (venues.length === 0) return null;
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const id = store.get("active_venue")?.value;
  return venues.find((v) => v.id === id) ?? venues[0];
}
