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
    const prefetchRoutes = () => {
      for (const item of navItems) {
        router.prefetch(item.href);
        void prefetchDashboardRouteData(queryClient, item.href);
      }
    };

    if (typeof window === "undefined") {
      return undefined;
    }

    const browserWindow = window as Window & {
      requestIdleCallback?: typeof window.requestIdleCallback;
      cancelIdleCallback?: typeof window.cancelIdleCallback;
    };

    if (typeof browserWindow.requestIdleCallback === "function") {
      const idleId = browserWindow.requestIdleCallback(() => {
        prefetchRoutes();
      });

      return () => {
        browserWindow.cancelIdleCallback?.(idleId);
      };
    }

    const timeoutId = window.setTimeout(() => {
      prefetchRoutes();
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [queryClient, router]);

  return null;
}
