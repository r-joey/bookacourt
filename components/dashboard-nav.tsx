"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const OPERATIONS = [
  { href: "/dashboard", label: "Overview", icon: "home", exact: true },
  { href: "/dashboard/payments", label: "Payments", icon: "receipt" },
  { href: "/dashboard/schedule", label: "Schedule", icon: "grid" },
];

const SETUP = [
  { href: "/dashboard/courts", label: "Courts", icon: "court" },
  { href: "/dashboard/hours", label: "Hours", icon: "clock" },
  { href: "/dashboard/qr-codes", label: "QR codes", icon: "qr" },
  { href: "/dashboard/profile", label: "Venue profile", icon: "store" },
  { href: "/dashboard/staff", label: "Staff", icon: "users", ownerOnly: true },
  { href: "/dashboard/billing", label: "Billing", icon: "card", ownerOnly: true },
];

function Icon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 9.5 12 3l9 6.5" /><path d="M5 10v10h14V10" /></>,
    receipt: <><path d="M5 3v18l2-1 2 1 2-1 2 1 2-1 2 1V3l-2 1-2-1-2 1-2-1-2 1z" /><path d="M9 8h6M9 12h6" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></>,
    plus: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>,
    court: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="M12 5v14M3 12h18" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    qr: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M21 14v7h-7" /></>,
    store: <><path d="M4 9h16l-1-5H5z" /><path d="M4 9v11h16V9M9 20v-6h6v6" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M16 6a3 3 0 0 1 0 6M21 20c0-2-1-3.5-3-4.3" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export function DashboardNav({ isOwner, pendingPayments = 0 }: { isOwner: boolean; pendingPayments?: number }) {
  const pathname = usePathname();

  const item = (i: { href: string; label: string; icon: string; exact?: boolean }) => {
    const active = i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/");
    const badge = i.href === "/dashboard/payments" && pendingPayments > 0 ? pendingPayments : 0;
    return (
      <Link
        key={i.href}
        href={i.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          active ? "bg-blue-50 text-[var(--color-brand)]" : "text-slate-600 hover:bg-slate-100"
        }`}
      >
        <Icon name={i.icon} />
        <span className="flex-1">{i.label}</span>
        {badge > 0 && (
          <span className="grid min-w-5 place-items-center rounded-full bg-[var(--color-brand)] px-1.5 text-xs font-semibold leading-5 text-white" aria-label={`${badge} pending`}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-1">
      <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Operations</p>
      {OPERATIONS.map(item)}
      <p className="px-3 pb-1 pt-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Setup</p>
      {SETUP.filter((i) => isOwner || !i.ownerOnly).map(item)}
    </nav>
  );
}
