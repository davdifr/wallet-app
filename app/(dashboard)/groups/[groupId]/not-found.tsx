import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GroupDetailNotFound() {
  return (
    <div className="rounded-[2rem] border border-input bg-card p-8 text-center">
      <h1 className="font-display text-3xl font-semibold text-foreground">
        Gruppo non trovato
      </h1>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">
        Il gruppo richiesto non esiste piu oppure non e disponibile per il tuo account.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/groups">Torna ai gruppi</Link>
      </Button>
    </div>
  );
}
