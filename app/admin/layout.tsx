import { requirePlatformAdmin } from "@/lib/auth";
import { signOut } from "@/app/actions/auth";
import { AdminNav } from "./admin-nav";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requirePlatformAdmin();

  const sidebar = (
    <div className="flex h-full flex-col px-3 py-4">
      <div className="mb-5 flex items-center gap-2 px-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white font-bold">B</span>
        <div>
          <p className="text-sm font-bold leading-tight">BookaCourt</p>
          <p className="text-xs text-slate-400">Platform admin</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AdminNav />
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-slate-100 px-2 pt-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-800 text-xs font-semibold text-white">
          {(profile.full_name ?? "O").slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{profile.full_name ?? "Owner"}</p>
          <form action={signOut}>
            <button className="text-xs text-slate-400 hover:text-slate-600">Sign out</button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell sidebar={sidebar} title="Platform admin">
      {children}
    </DashboardShell>
  );
}
