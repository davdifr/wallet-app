"use client";

import Link from "next/link";
import { ArrowRight, ReceiptText, Scale, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GroupDetails } from "@/types/group-expenses";

type GroupsListProps = {
  groups: GroupDetails[];
};

export function GroupsList({ groups }: GroupsListProps) {
  return (
    <Card className="border-white/70 bg-white/85 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle className="font-display text-2xl text-slate-950">
          I tuoi gruppi
        </CardTitle>
        <p className="text-sm text-slate-500">
          Apri un gruppo per vedere membri, spese condivise, saldi e rimborsi nel dettaglio.
        </p>
      </CardHeader>

      <CardContent>
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center">
            <h3 className="font-display text-xl font-semibold text-slate-950">
              Nessun gruppo creato
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Crea il primo gruppo per iniziare a dividere spese e rimborsi.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((item) => (
              <Link
                key={item.group.id}
                href={`/groups/${item.group.id}`}
                className="group rounded-[2rem] border border-slate-200 bg-slate-50/80 p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold text-slate-950">
                      {item.group.name}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {item.group.description || "Nessuna descrizione disponibile."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-500 transition group-hover:border-slate-300 group-hover:text-slate-950">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span>{item.group.members.length} membri</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ReceiptText className="h-3.5 w-3.5" />
                      <span>{item.expenses.length} spese</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Scale className="h-3.5 w-3.5" />
                      <span>{item.summary.debts.length} debiti aperti</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    {item.settlements.filter((settlement) => settlement.status === "pending").length}{" "}
                    rimborsi in attesa
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
