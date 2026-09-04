"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Tenants", exact: true },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((i) => {
        const active = i.exact ? pathname === i.href : pathname.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-blue-50 text-[var(--color-brand)]" : "text-slate-600 hover:bg-slate-100"}`}
          >
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
