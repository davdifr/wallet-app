import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck, Wallet } from "lucide-react";

import { AuthCard } from "@/components/layout/auth-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getUser } from "@/services/auth/get-user";

import { signInWithGoogle } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    message?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getUser();

  if (user) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const message = params.message;

  return (
    <section>
      <div className="container flex min-h-screen flex-col justify-center gap-10 py-10 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-6">
          <Badge>Wallet App</Badge>
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Gestisci il tuo wallet con un dashboard pulito, veloce e sicuro.
            </h1>
            <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
              Base full-stack pronta per crescere: Next.js App Router, Supabase,
              route protette e una UI minimal mobile-first.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-2xl border border-input bg-card p-4">
              <ShieldCheck className="mb-3 h-5 w-5 text-muted-foreground" />
              Accesso OAuth con Google e sessione sincronizzata lato server.
            </div>
            <div className="rounded-2xl border border-input bg-card p-4">
              <Wallet className="mb-3 h-5 w-5 text-muted-foreground" />
              Architettura divisa per componenti, servizi, hook e types.
            </div>
          </div>
        </div>

        <AuthCard
          footer={
            <p className="text-center text-xs text-muted-foreground">
              Continuando accetti il flusso OAuth di Google configurato su
              Supabase.
            </p>
          }
        >
          <div className="space-y-2 text-center">
            <h2 className="font-display text-2xl font-semibold text-foreground">
              Accedi
            </h2>
            <p className="text-sm text-muted-foreground">
              Entra nella dashboard e completa il setup del tuo wallet.
            </p>
          </div>

          <form action={signInWithGoogle} className="space-y-4">
            <Button type="submit" className="h-11 w-full text-sm">
              Continua con Google
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {message ? (
            <div className="rounded-xl border border-input bg-muted px-4 py-3 text-sm text-foreground">
              {message}
            </div>
          ) : null}

          <p className="text-center text-sm text-muted-foreground">
            Dopo il login verrai reindirizzato su{" "}
            <Link href="/dashboard" className="font-medium text-foreground underline">
              dashboard
            </Link>
            .
          </p>
        </AuthCard>
      </div>
    </section>
  );
}
