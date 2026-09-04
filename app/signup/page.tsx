"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function SignupPage() {
  const [state, action] = useActionState<AuthState, FormData>(signUp, undefined);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center gap-2 justify-center">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-brand)] text-white font-bold">
            B
          </span>
          <span className="text-lg font-bold">BookaCourt</span>
        </Link>

        <div className="card p-6">
          <h1 className="text-xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Start taking online court bookings today.
          </p>

          <form action={action} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="full_name">Full name</label>
              <input id="full_name" name="full_name" className="input" placeholder="Marisol Reyes" required />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" placeholder="you@email.com" required />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone (optional)</label>
              <input id="phone" name="phone" className="input" placeholder="0917 000 0000" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="input" placeholder="At least 8 characters" required />
            </div>

            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            )}

            <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--color-brand)]">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
