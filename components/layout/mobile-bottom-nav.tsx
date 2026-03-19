"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { GroupsNavIndicator } from "@/components/layout/groups-nav-indicator";
import { prefetchDashboardRouteData } from "@/lib/query/prefetch-dashboard-route-data";
import { cn } from "@/lib/utils";

import { isActivePath, navItems } from "./sidebar-nav";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  function prefetchNavTarget(href: string) {
    router.prefetch(href);
    void prefetchDashboardRouteData(queryClient, href);
  }

  return (
    <nav
      className="safe-bottom-nav fixed z-30 rounded-[1.7rem] border border-white/6 bg-[#121927]/95 p-2 shadow-float backdrop-blur-xl lg:hidden"
      aria-label="Navigazione principale"
    >
      <ul className="grid grid-cols-5 gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                onMouseEnter={() => prefetchNavTarget(item.href)}
                onFocus={() => prefetchNavTarget(item.href)}
                onTouchStart={() => prefetchNavTarget(item.href)}
                className={cn(
                  "relative flex min-h-[3.5rem] flex-col items-center justify-center gap-1 rounded-[1.1rem] px-1 py-2.5 text-center text-[10px] font-medium leading-none transition",
                  active
                    ? "bg-white/[0.08] text-[#55C7FF]"
                    : "text-slate-500"
                )}
                aria-label={item.label}
              >
                {item.href === "/groups" ? <GroupsNavIndicator mobile /> : null}
                <Icon className="h-4 w-4 shrink-0" />
                <span className="max-w-full truncate">{item.mobileLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
