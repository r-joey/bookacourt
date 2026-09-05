"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth";

export type ActionState = { error?: string; ok?: boolean } | undefined;

// ---------------- active venue ----------------
export async function setActiveVenue(venueId: string) {
  const store = await cookies();
  store.set("active_venue", venueId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/dashboard", "layout");
}

// ---------------- venues ----------------
const venueSchema = z.object({
  name: z.string().trim().min(2, "Venue name is required."),
  sport: z.string().trim().min(1),
});

export async function createVenue(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const parsed = venueSchema.safeParse({
    name: formData.get("name"),
    sport: formData.get("sport"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: slug } = await supabase.rpc("generate_venue_slug", { p_name: parsed.data.name });

  const { data: venue, error } = await supabase
    .from("venues")
    .insert({
      owner_id: user.id,
      name: parsed.data.name,
      sport: parsed.data.sport,
      slug: slug ?? parsed.data.name.toLowerCase().replace(/\s+/g, "-"),
    })
    .select("id")
    .single();
  if (error || !venue) return { error: error?.message ?? "Could not create venue." };

  // Default operating hours: 6am–11pm every day.
  const hours = Array.from({ length: 7 }, (_, weekday) => ({
    venue_id: venue.id,
    weekday,
    opens: "06:00",
    closes: "23:00",
    is_closed: false,
  }));
  await supabase.from("venue_hours").insert(hours);

  const store = await cookies();
  store.set("active_venue", venue.id, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  redirect("/dashboard/courts");
}

export async function updateVenueProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const venueId = String(formData.get("venue_id"));
  const supabase = await createClient();

  const amenities = String(formData.get("amenities") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const latRaw = formData.get("latitude");
  const lngRaw = formData.get("longitude");

  // Handle / slug — normalize and enforce uniqueness.
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = rawSlug
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) return { error: "Handle can't be empty." };
  const { data: clash } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", slug)
    .neq("id", venueId)
    .maybeSingle();
  if (clash) return { error: `The handle @${slug} is already taken.` };

  // Banners (JSON array of urls, max 5).
  let banner_urls: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("banner_urls") ?? "[]"));
    if (Array.isArray(parsed)) banner_urls = parsed.filter((u) => typeof u === "string").slice(0, 5);
  } catch {
    banner_urls = [];
  }

  const { error } = await supabase
    .from("venues")
    .update({
      name: String(formData.get("name") ?? "").trim(),
      slug,
      description: String(formData.get("description") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      contact_number: String(formData.get("contact_number") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      facebook: String(formData.get("facebook") ?? "").trim() || null,
      instagram: String(formData.get("instagram") ?? "").trim() || null,
      amenities,
      banner_urls,
      latitude: latRaw ? Number(latRaw) : null,
      longitude: lngRaw ? Number(lngRaw) : null,
      logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    })
    .eq("id", venueId);

  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function togglePublish(venueId: string, publish: boolean) {
  const supabase = await createClient();
  await supabase.from("venues").update({ is_published: publish }).eq("id", venueId);
  revalidatePath("/dashboard", "layout");
}

// ---------------- courts ----------------
export async function createCourt(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const venueId = String(formData.get("venue_id"));
  const name = String(formData.get("name") ?? "").trim().slice(0, 32);
  const sport = String(formData.get("sport") ?? "").trim();
  const price = Number(formData.get("hourly_price") ?? 0);
  if (name.length < 1) return { error: "Court name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("courts").insert({
    venue_id: venueId,
    name,
    sport: sport || "Badminton",
    hourly_price: Number.isFinite(price) ? Math.max(0, Math.round(price)) : 0,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/courts");
  return { ok: true };
}

export async function updateCourt(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase
    .from("courts")
    .update({
      name: String(formData.get("name") ?? "").trim().slice(0, 32),
      sport: String(formData.get("sport") ?? "").trim(),
      hourly_price: Math.max(0, Math.round(Number(formData.get("hourly_price") ?? 0))),
      is_active: formData.get("is_active") === "on",
    })
    .eq("id", id);
  revalidatePath("/dashboard/courts");
}

export async function deleteCourt(id: string) {
  const supabase = await createClient();
  // Soft delete — keeps the billing creation event intact.
  await supabase.from("courts").update({ deleted_at: new Date().toISOString(), is_active: false }).eq("id", id);
  revalidatePath("/dashboard/courts");
}

// ---------------- court pricing rules (peak / off-peak) ----------------
export async function createPricingRule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const courtId = String(formData.get("court_id"));
  const venueId = String(formData.get("venue_id"));
  const days = formData.getAll("days").map((d) => Number(d)).filter((d) => d >= 0 && d <= 6);
  const start = Number(formData.get("start_hour"));
  const end = Number(formData.get("end_hour"));
  const price = Math.round(Number(formData.get("price") ?? 0));
  if (!days.length) return { error: "Pick at least one day." };
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { error: "End time must be after the start time." };
  }
  if (!Number.isFinite(price) || price < 0) return { error: "Enter a valid price." };

  const supabase = await createClient();
  const { error } = await supabase.from("court_pricing_rules").insert({
    court_id: courtId,
    venue_id: venueId,
    days,
    start_hour: start,
    end_hour: end,
    price,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/courts");
  return { ok: true };
}

export async function deletePricingRule(id: string) {
  const supabase = await createClient();
  await supabase.from("court_pricing_rules").delete().eq("id", id);
  revalidatePath("/dashboard/courts");
}

// ---------------- hours ----------------
export async function saveHours(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const venueId = String(formData.get("venue_id"));
  const supabase = await createClient();

  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    venue_id: venueId,
    weekday,
    opens: String(formData.get(`open_${weekday}`) ?? "06:00"),
    closes: String(formData.get(`close_${weekday}`) ?? "23:00"),
    is_closed: formData.get(`closed_${weekday}`) === "on",
  }));

  const { error } = await supabase
    .from("venue_hours")
    .upsert(rows, { onConflict: "venue_id,weekday" });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/hours");
  return { ok: true };
}

// ---------------- payment methods ----------------
export async function createPaymentMethod(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const venueId = String(formData.get("venue_id"));
  const label = String(formData.get("label") ?? "").trim();
  const qr_url = String(formData.get("qr_url") ?? "").trim();
  if (!label) return { error: "Give this payment method a label (e.g. BPI, GCash)." };
  if (!qr_url) return { error: "Please upload the QR image." };

  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").insert({
    venue_id: venueId,
    label,
    qr_url,
    account_name: String(formData.get("account_name") ?? "").trim() || null,
    account_number: String(formData.get("account_number") ?? "").trim() || null,
    note: String(formData.get("note") ?? "").trim() || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/qr-codes");
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

export async function togglePaymentMethod(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("payment_methods").update({ is_active: active }).eq("id", id);
  revalidatePath("/dashboard/qr-codes");
  revalidatePath("/dashboard", "layout");
}

export async function deletePaymentMethod(id: string) {
  const supabase = await createClient();
  await supabase.from("payment_methods").delete().eq("id", id);
  revalidatePath("/dashboard/qr-codes");
  revalidatePath("/dashboard", "layout");
}

// ---------------- bookings ----------------
export async function confirmBooking(id: string) {
  const supabase = await createClient();
  await supabase
    .from("bookings")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard", "layout");
}

export async function cancelBooking(id: string) {
  const supabase = await createClient();
  await supabase
    .from("bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/dashboard", "layout");
}

export async function completeBooking(id: string) {
  const supabase = await createClient();
  await supabase.from("bookings").update({ status: "completed" }).eq("id", id);
  revalidatePath("/dashboard", "layout");
}

// ---------------- walk-in ----------------
export async function createWalkin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const venueId = String(formData.get("venue_id"));
  const date = String(formData.get("date"));
  const name = String(formData.get("customer_name") ?? "").trim();
  const phone = String(formData.get("customer_phone") ?? "").trim();
  const slots = JSON.parse(String(formData.get("slots") ?? "[]"));
  if (!slots.length) return { error: "Select at least one slot." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_walkin_booking", {
    p_venue_id: venueId,
    p_date: date,
    p_customer_name: name,
    p_customer_phone: phone,
    p_slots: slots,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard", "layout");
  return { ok: true };
}

// ---------------- staff ----------------
export async function inviteStaff(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!hasServiceRole()) {
    return { error: "Staff accounts require the SUPABASE_SERVICE_ROLE_KEY to be configured." };
  }
  const venueId = String(formData.get("venue_id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 8) return { error: "Enter an email and a password (min 8 chars)." };

  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Verify the current user owns this venue before creating anything.
  const supabase = await createClient();
  const { data: venue } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!venue) return { error: "Only the venue owner can add staff." };

  const admin = createAdminClient();

  // Reuse an existing account if the email is already a staff user, else create.
  let staffId: string | null = null;
  const { data: existing } = await admin
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    if (existing.role !== "staff") {
      return { error: "That email already belongs to another account." };
    }
    staffId = existing.id;
  } else {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "staff", full_name: fullName },
    });
    if (cErr) return { error: cErr.message };
    staffId = created.user?.id ?? null;
  }
  if (!staffId) return { error: "Could not create the staff account." };

  const { error: linkErr } = await admin
    .from("venue_staff")
    .insert({ venue_id: venueId, profile_id: staffId });
  if (linkErr && !/duplicate|unique/i.test(linkErr.message)) {
    return { error: linkErr.message };
  }

  revalidatePath("/dashboard/staff");
  return { ok: true };
}

export async function removeStaff(venueId: string, profileId: string) {
  const supabase = await createClient();
  await supabase.from("venue_staff").delete().eq("venue_id", venueId).eq("profile_id", profileId);
  revalidatePath("/dashboard/staff");
}
