import Link from "next/link";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { LogOut, Wallet } from "lucide-react";

import { signOut } from "@/app/(dashboard)/dashboard/actions";
import { GroupsUnreadProvider } from "@/components/layout/groups-unread-provider";
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
    <GroupsUnreadProvider currentUserId={user.id}>
      <div className="min-h-[100dvh] bg-background">
        <header className="safe-header sticky top-0 z-20 border-b border-white/5 bg-background/90 backdrop-blur-xl">
          <div className="safe-container container flex h-[4.5rem] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-card text-foreground shadow-card">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <Link href="/dashboard" className="font-display text-xl font-semibold tracking-tight">
                  Wallet App
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-[1rem] bg-card px-3 py-2 text-right shadow-card md:block">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
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

        <div className="safe-container safe-mobile-content container flex gap-6 py-5 lg:py-6">
          <aside className="hidden w-64 shrink-0 lg:block">
            <SidebarNav />
          </aside>

          <main className="min-w-0 flex-1 ios-scroll">{children}</main>
        </div>

        <MobileBottomNav />
      </div>
    </GroupsUnreadProvider>
  );
}
