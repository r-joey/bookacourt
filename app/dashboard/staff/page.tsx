import { getActiveVenue, getSessionUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { hasServiceRole } from "@/lib/supabase/admin";
import { StaffManager } from "./staff-manager";

export default async function StaffPage() {
  const [venue, user] = await Promise.all([getActiveVenue(), getSessionUser()]);
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;
  if (venue.owner_id !== user!.id) {
    return <p className="text-slate-500">Only the venue owner can manage staff.</p>;
  }

  const supabase = await createClient();
  const { data: staff } = await supabase
    .from("venue_staff")
    .select("profile_id, profiles(full_name, email)")
    .eq("venue_id", venue.id);

  const rows = (staff ?? []).map((s) => ({
    profile_id: s.profile_id,
    full_name: (s as { profiles: { full_name: string | null } | null }).profiles?.full_name ?? null,
    email: (s as { profiles: { email: string | null } | null }).profiles?.email ?? null,
  }));

  return <StaffManager venueId={venue.id} staff={rows} canInvite={hasServiceRole()} />;
}
