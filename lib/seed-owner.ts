import "server-only";
import { createAdminClient, hasServiceRole } from "./supabase/admin";

// Ensures the single platform-owner account exists, using credentials from
// the environment. Runs on server startup (see instrumentation.ts). Idempotent.
export async function seedOwner() {
  if (!hasServiceRole()) return; // owner may have been seeded via SQL already
  const email = process.env.OWNER_EMAIL;
  const password = process.env.OWNER_PASSWORD;
  if (!email || !password) return;

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .eq("role", "platform_admin")
      .maybeSingle();
    if (existing) return;

    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "platform_admin", full_name: "Platform Owner" },
    });
    // "already registered" is fine (e.g. seeded via SQL).
    if (error && !/registered|exists/i.test(error.message)) {
      console.warn("[seedOwner]", error.message);
    }
  } catch (err) {
    console.warn("[seedOwner] skipped:", (err as Error).message);
  }
}
