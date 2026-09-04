"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/submit-button";

export default function LoginPage() {
  const [state, action] = useActionState<AuthState, FormData>(signIn, undefined);

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
          <h1 className="text-xl font-bold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to manage your venue.
          </p>

          <form action={action} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" className="input" placeholder="you@email.com" required />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" className="input" placeholder="••••••••" required />
            </div>

            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            )}

            <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-[var(--color-brand)]">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
