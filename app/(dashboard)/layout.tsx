import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
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
      <AppShell user={user}>{children}</AppShell>
    </DashboardQueryProvider>
  );
}
