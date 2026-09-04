import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    .select("name, slug")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!venue) notFound();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-md px-5 py-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{venue.name}</h1>
          <Link href={`/@${venue.slug}`} className="text-sm font-medium text-[var(--color-brand)]">Venue page</Link>
        </div>
        <FindBooking />
      </div>
    </div>
  );
}
