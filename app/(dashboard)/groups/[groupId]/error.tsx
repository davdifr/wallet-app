"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

type GroupDetailErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GroupDetailError({ error, reset }: GroupDetailErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
      <h2 className="font-display text-2xl font-semibold">Errore caricamento</h2>
      <p className="mt-2 text-sm">
        Non siamo riusciti a leggere il dettaglio del gruppo. Riprova tra un momento.
      </p>
      <Button onClick={reset} className="mt-4">
        Riprova
      </Button>
    </div>
  );
}
