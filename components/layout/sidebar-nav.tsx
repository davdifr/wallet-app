"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  LayoutGrid,
  Repeat,
  Target,
  Users
} from "lucide-react";

import { GroupsNavIndicator } from "@/components/layout/groups-nav-indicator";
import { prefetchDashboardRouteData } from "@/lib/query/prefetch-dashboard-route-data";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Home", icon: LayoutGrid },
  {
    href: "/transactions",
    label: "Transazioni",
    mobileLabel: "Movimenti",
    icon: ArrowRightLeft
  },
  {
    href: "/recurring-incomes",
    label: "Entrate ricorrenti",
    mobileLabel: "Entrate",
    icon: Repeat
  },
  { href: "/saving-goals", label: "Obiettivi", mobileLabel: "Goals", icon: Target },
  { href: "/groups", label: "Gruppi", mobileLabel: "Gruppi", icon: Users }
] as const;

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  function prefetchNavTarget(href: string) {
    router.prefetch(href);
    void prefetchDashboardRouteData(queryClient, href);
  }

  return (
    <nav className="space-y-2 rounded-[1.75rem] border border-white/6 bg-card p-4 shadow-card">
      <p className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
        Navigazione
      </p>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            onMouseEnter={() => prefetchNavTarget(item.href)}
            onFocus={() => prefetchNavTarget(item.href)}
            onTouchStart={() => prefetchNavTarget(item.href)}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-[1.1rem] px-4 py-3 text-sm font-medium transition",
              active
                ? "bg-white/[0.08] text-[#55C7FF]"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            {item.href === "/groups" ? <GroupsNavIndicator /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
