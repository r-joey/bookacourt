import Link from "next/link";
import { getProfile } from "@/lib/auth";
import { SPORTS, SPORT_EMOJI } from "@/lib/constants";
import { LogoMark } from "@/components/logo";

/* Small stroke-icon set (24×24, currentColor) used across the marketing sections. */
const ICONS: Record<string, string> = {
  buildings:
    "M3 21h18M6 21V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16M14 9h3a1 1 0 0 1 1 1v11M9 8h2M9 12h2M9 16h2",
  tag: "M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L3 13V4a1 1 0 0 1 1-1h9l7.59 7.59a2 2 0 0 1 0 2.82ZM7.5 7.5h.01",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z",
  qr: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h3v3h-3zM20 14v6M17 20h3",
  calendar:
    "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  chart: "M3 3v18h18M7 14l3-3 3 3 5-6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  bolt: "M13 2 3 14h7l-1 8 10-12h-7l1-8Z",
  wallet:
    "M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v3M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 1 1-1v-3M21 12h-5a2 2 0 1 0 0 4h5v-4Z",
  shield: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3ZM9 12l2 2 4-4",
  check: "M20 6 9 17l-5-5",
};

function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}

const BENEFITS = [
  {
    icon: "clock",
    title: "Fill more court hours",
    body: "Your page takes bookings 24/7 — even while you sleep. Off-peak slots that used to sit empty get booked online without a single phone call.",
  },
  {
    icon: "wallet",
    title: "Get paid before they play",
    body: "Customers pay by QR and upload proof up front, so you confirm with the money already in. No-shows and unpaid reservations drop to near zero.",
  },
  {
    icon: "bolt",
    title: "Cut the DM chaos",
    body: "Stop juggling Messenger threads, screenshots and a paper logbook. Every reservation lands in one queue you approve with a tap.",
  },
  {
    icon: "buildings",
    title: "Run every venue in one place",
    body: "Own more than one site? Switch between venues from a single login and see each one's schedule, courts and revenue side by side.",
  },
];

const FEATURES = [
  {
    icon: "buildings",
    title: "Manage multiple venues",
    body: "Add as many venues as you run. Each gets its own public page, courts, hours and payment QR — all under one owner account.",
  },
  {
    icon: "tag",
    title: "Set a price for every court",
    body: "Give each court its own hourly rate, then add peak / off-peak rules by day and time so weekend prime time can differ from a weekday morning.",
  },
  {
    icon: "grid",
    title: "Any court, any sport",
    body: "Mix badminton, basketball, pickleball, tennis, volleyball, futsal and table tennis under one roof — each court tagged with its own sport.",
  },
  {
    icon: "globe",
    title: "Your own booking page",
    body: "Publish at bookacourt.ph/@your-venue with a map, amenities and operating hours. Share the link or a QR code anywhere.",
  },
  {
    icon: "qr",
    title: "QR payments with proof",
    body: "Show your GCash / QRPH code, let customers upload their receipt, and approve or decline each one from a clean confirmation queue.",
  },
  {
    icon: "calendar",
    title: "Schedule board & walk-ins",
    body: "See the whole day across every court, block slots, and log walk-in players in seconds so online and in-person bookings never clash.",
  },
  {
    icon: "users",
    title: "Staff accounts",
    body: "Invite your front-desk team to manage bookings and walk-ins without handing over your owner login or billing.",
  },
  {
    icon: "chart",
    title: "Today & revenue at a glance",
    body: "Open the dashboard to today's bookings, what's next up, court capacity and confirmed revenue — no spreadsheet required.",
  },
];

const STEPS = [
  {
    t: "Set up your venue",
    d: "Add your courts, hours, amenities and a payment QR, then publish your page at bookacourt.ph/@your-venue.",
  },
  {
    t: "Customers book & pay",
    d: "They pick a slot, pay by QR and upload proof — no account needed. Their slot is held while they check out.",
  },
  {
    t: "Run the day",
    d: "Approve payments from the queue, add walk-ins, watch the schedule board and track revenue in real time.",
  },
];

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
          <LogoMark className="h-9 w-9" />
          <span className="text-lg font-bold">BookaCourt</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <a href="#features" className="hidden font-semibold text-slate-600 hover:text-slate-900 sm:inline">
            Features
          </a>
          <a href="#pricing" className="hidden font-semibold text-slate-600 hover:text-slate-900 sm:inline">
            Pricing
          </a>
          {profile ? (
            <Link href={primaryHref} className="btn-primary btn-sm">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-slate-600 hover:text-slate-900">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary btn-sm">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 -top-24 -z-10 h-72 opacity-60 blur-3xl"
            style={{
              background:
                "radial-gradient(40rem 20rem at 30% 0%, var(--color-brand-soft), transparent)",
            }}
          />
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
            <span className="badge-blue">For court &amp; venue owners</span>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Host your courts online and get paid — without the chaos.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Publish a booking page for every venue, let customers reserve and
              pay by QR, and run your whole day from one clean dashboard.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={primaryHref} className="btn-primary">
                {profile ? "Open dashboard" : "List your venue free"}
              </Link>
              <a href="#how" className="btn-ghost">
                See how it works
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              No setup fee · Pay only for the courts you list · Cancel anytime
            </p>

            {/* Sports supported */}
            <div className="mt-10 flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm font-medium text-slate-500">
                Built for every court:
              </span>
              {SPORTS.map((s) => (
                <span key={s} className="badge-gray">
                  <span aria-hidden="true">{SPORT_EMOJI[s]}</span> {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits — why host with us */}
        <section className="border-y border-[var(--color-line)] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="max-w-2xl">
              <span className="badge-green">Why owners host with us</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Turn empty court hours into paid bookings
              </h2>
              <p className="mt-3 text-slate-600">
                BookaCourt does the front desk work for you — so you spend less
                time chasing payments and more time running your venue.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="card flex gap-4 p-5">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[var(--color-brand-soft)] text-[var(--color-brand)]">
                    <Icon name={b.icon} className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{b.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section id="features" className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="max-w-2xl">
            <span className="badge-blue">Everything in one app</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Built to manage real venues
            </h2>
            <p className="mt-3 text-slate-600">
              From a single badminton court to a multi-sport complex across
              several sites — BookaCourt scales with you.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-[var(--color-brand)]">
                  <Icon name={f.icon} />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-[var(--color-line)] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
            <div className="max-w-2xl">
              <span className="badge-amber">How it works</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Live in an afternoon
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {STEPS.map((f, i) => (
                <div key={f.t} className="card p-5">
                  <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-sm font-bold text-[var(--color-brand)]">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-slate-600">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="max-w-xl">
              <span className="badge-blue">Simple pricing</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Pay only for the courts you list
              </h2>
              <p className="mt-3 text-slate-600">
                One flat rate per active court, billed monthly. No setup fees,
                no commission on your bookings, no long-term contract. List a
                new court and your bill goes up; remove one and it goes down.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {[
                  "Unlimited bookings and walk-ins",
                  "Unlimited venues under one account",
                  "You keep 100% of every payment",
                  "Free staff accounts",
                ].map((li) => (
                  <li key={li} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[var(--color-brand)]">
                      <Icon name="check" className="h-4 w-4" />
                    </span>
                    {li}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-8">
              <p className="text-sm font-medium text-slate-500">
                Per active court
              </p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight">₱100</span>
                <span className="text-slate-500">/ month</span>
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Billed on a monthly cycle from your signup date. A three-court
                venue is just ₱300 a month — often less than a single unpaid
                no-show.
              </p>
              <Link href={primaryHref} className="btn-primary mt-6 w-full">
                {profile ? "Open dashboard" : "Start listing free"}
              </Link>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <Icon name="shield" className="h-4 w-4" /> Cancel anytime — no lock-in
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div
            className="rounded-2xl px-8 py-12 text-center text-white sm:px-12"
            style={{
              background:
                "linear-gradient(135deg, var(--color-brand), var(--color-brand-dark))",
            }}
          >
            <h2 className="text-3xl font-bold tracking-tight">
              Ready to take bookings online?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-blue-100">
              Set up your first venue in minutes and share your booking link
              today. It only takes an afternoon.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href={primaryHref}
                className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-brand)] transition hover:bg-blue-50"
              >
                {profile ? "Open dashboard" : "List your venue free"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--color-line)] py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} BookaCourt · Court booking &amp; venue management
      </footer>
    </div>
  );
}
