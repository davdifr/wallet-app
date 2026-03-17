"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRightLeft,
  LayoutGrid,
  Repeat,
  Target,
  Users
} from "lucide-react";

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
    label: "Recurring Incomes",
    mobileLabel: "Entrate",
    icon: Repeat
  },
  { href: "/saving-goals", label: "Saving Goals", mobileLabel: "Goals", icon: Target },
  { href: "/groups", label: "Group Expenses", mobileLabel: "Gruppi", icon: Users }
] as const;

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2 rounded-3xl border border-white/70 bg-white/85 p-4 shadow-soft backdrop-blur">
      <p className="px-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
        Navigazione
      </p>
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
              active
                ? "bg-slate-950 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
