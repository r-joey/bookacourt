import Link from "next/link";
import { getProfile } from "@/lib/auth";

export default async function Home() {
  const profile = await getProfile();
  const primaryHref = profile
    ? profile.role === "platform_admin"
      ? "/admin"
      : "/dashboard"
    : "/signup";

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-brand)] text-white font-bold">
            B
          </span>
          <span className="text-lg font-bold">BookaCourt</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {profile ? (
            <Link href={primaryHref} className="btn-primary btn-sm">Go to dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-slate-600 hover:text-slate-900">Sign in</Link>
              <Link href="/signup" className="btn-primary btn-sm">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="py-16 sm:py-24">
          <span className="badge-blue">For court & venue owners</span>
          <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Take online court bookings and get paid — without the chaos.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            Publish a booking page for your venue, let customers reserve and pay
            by QR, and manage everything from one clean dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryHref} className="btn-primary">
              {profile ? "Open dashboard" : "Create your venue"}
            </Link>
            <a href="#how" className="btn-ghost">See how it works</a>
          </div>
        </section>

        <section id="how" className="grid gap-4 pb-20 sm:grid-cols-3">
          {[
            { t: "Set up your venue", d: "Add courts, hours, amenities and a payment QR. Publish your page at bookacourt.ph/@your-venue." },
            { t: "Customers book & pay", d: "They pick a slot, upload proof of a QR payment, and you confirm from the queue." },
            { t: "Run the day", d: "See today's bookings, add walk-ins, and track revenue at a glance." },
          ].map((f, i) => (
            <div key={f.t} className="card p-5">
              <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-[var(--color-brand)]">
                {i + 1}
              </div>
              <h3 className="font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.d}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)] py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} BookaCourt
      </footer>
    </div>
  );
}
