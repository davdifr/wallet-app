import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GroupDetailNotFound() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-8 text-center shadow-soft">
      <h1 className="font-display text-3xl font-semibold text-slate-950">
        Gruppo non trovato
      </h1>
      <p className="mt-3 text-sm text-slate-500 sm:text-base">
        Il gruppo richiesto non esiste piu oppure non e disponibile per il tuo account.
      </p>
      <Button className="mt-6" asChild>
        <Link href="/groups">Torna ai gruppi</Link>
      </Button>
    </div>
  );
}
