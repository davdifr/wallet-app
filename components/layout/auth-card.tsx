import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

type AuthCardProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ children, footer }: AuthCardProps) {
  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-6 p-6 sm:p-8">
        {children}
        {footer}
      </CardContent>
    </Card>
  );
}
