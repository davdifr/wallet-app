"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type RecurringIncomesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function RecurringIncomesError({
  error,
  reset
}: RecurringIncomesErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-[1.75rem] bg-card p-6 shadow-card">
      <h2 className="font-display text-2xl font-semibold">Errore caricamento</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Non siamo riusciti a leggere le ricorrenze. Riprova tra un momento.
      </p>
      <Button onClick={reset} className="mt-5">
        Riprova
      </Button>
    </div>
  );
}
