import { getActiveVenue } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const venue = await getActiveVenue();
  if (!venue) return <p className="text-slate-500">Create a venue first.</p>;
  return <ProfileForm venue={venue} />;
}
