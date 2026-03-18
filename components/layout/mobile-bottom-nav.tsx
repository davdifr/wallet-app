"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { isActivePath, navItems } from "./sidebar-nav";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-2 bottom-2 z-30 rounded-[1.35rem] border border-white/80 bg-white/95 p-1 shadow-soft backdrop-blur lg:hidden">
      <ul className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-11 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 py-2 text-center text-[10px] font-medium leading-none transition",
                  active
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                )}
                aria-label={item.label}
              >
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
