import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { DashboardRoutePrefetch } from "@/components/layout/dashboard-route-prefetch";
import { DashboardQueryProvider } from "@/components/providers/dashboard-query-provider";
import { getUser } from "@/services/auth/get-user";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DashboardQueryProvider>
      <DashboardRoutePrefetch />
      <AppShell user={user}>{children}</AppShell>
    </DashboardQueryProvider>
  );
}
