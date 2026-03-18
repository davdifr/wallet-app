"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { prefetchDashboardRouteData } from "@/lib/query/prefetch-dashboard-route-data";

import { navItems } from "./sidebar-nav";

export function DashboardRoutePrefetch() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const priorityRoutes = ["/transactions", "/saving-goals", "/recurring-incomes"] as const;

    const prefetchRoute = (href: string) => {
      router.prefetch(href);
      void prefetchDashboardRouteData(queryClient, href);
    };

    const prefetchRoutes = () => {
      for (const item of navItems) {
        prefetchRoute(item.href);
      }
    };

    if (typeof window === "undefined") {
      return undefined;
    }

    const browserWindow = window as Window & {
      requestIdleCallback?: typeof window.requestIdleCallback;
      cancelIdleCallback?: typeof window.cancelIdleCallback;
    };

    const rafId = window.requestAnimationFrame(() => {
      priorityRoutes.forEach((href) => {
        prefetchRoute(href);
      });
    });

    if (typeof browserWindow.requestIdleCallback === "function") {
      const idleId = browserWindow.requestIdleCallback(() => {
        prefetchRoutes();
      });

      return () => {
        window.cancelAnimationFrame(rafId);
        browserWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      prefetchRoutes();
    }, 250);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [queryClient, router]);

  return null;
}
