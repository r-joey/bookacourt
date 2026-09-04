"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export type AuthState = { error?: string } | undefined;

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { full_name, email, phone, password } = parsed.data;

  // Preferred path: create a confirmed account via the service role so the
  // tenant can sign in immediately (no email round-trip).
  if (hasServiceRole()) {
    const admin = createAdminClient();
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "tenant", full_name, phone },
    });
    if (createErr) {
      return {
        error: /registered|exists/i.test(createErr.message)
          ? "An account with this email already exists."
          : createErr.message,
      };
    }
  } else {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: "tenant", full_name, phone } },
    });
    if (error) return { error: error.message };
  }

  // Sign them in.
  const supabase = await createClient();
  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
  if (signInErr) {
    return {
      error:
        "Account created, but automatic sign-in failed (email confirmation may be enabled). Please sign in.",
    };
  }
  redirect("/dashboard");
}

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Invalid email or password." };

  // Route platform owner to the admin console, everyone else to the dashboard.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(profile?.role === "platform_admin" ? "/admin" : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
