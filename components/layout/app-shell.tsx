import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut, Wallet } from "lucide-react";

import { signOut } from "@/app/(dashboard)/dashboard/actions";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";

type AppShellProps = {
  children: ReactNode;
  user: User;
};

export function AppShell({ children, user }: AppShellProps) {
  const userName =
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    user.email ??
    "Utente";

  return (
    <div className="min-h-screen">
      <header className="safe-header sticky top-0 z-20 border-b border-white/70 bg-white/85 backdrop-blur">
        <div className="safe-container container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-950 p-2 text-white shadow-soft">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <Link href="/dashboard" className="font-display text-lg font-semibold">
                Wallet App
              </Link>
              <p className="text-xs text-slate-500">Dashboard personale</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-right md:block">
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>

            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm" className="shrink-0">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Esci</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="safe-container safe-mobile-content container flex gap-6 py-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <SidebarNav />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
