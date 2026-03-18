"use client";

import { useEffect, useState } from "react";
import { PiggyBank, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";
import { Select } from "@/components/ui/select";
import type {
  PiggyBankMovementFormValues,
  PiggyBankSettingsFormValues,
  PiggyBankSummary
} from "@/types/piggy-bank";

type PiggyBankCardProps = {
  summary: PiggyBankSummary;
  onSubmitMovement: (values: PiggyBankMovementFormValues) => Promise<string | null>;
  onSubmitSettings: (values: PiggyBankSettingsFormValues) => Promise<string | null>;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function getDefaultMonth() {
  return new Date().toISOString().slice(0, 7) + "-01";
}

export function PiggyBankCard({
  summary,
  onSubmitMovement,
  onSubmitSettings
}: PiggyBankCardProps) {
  const [activePanel, setActivePanel] = useState<"movement" | "settings">("movement");
  const [movementValues, setMovementValues] = useState<PiggyBankMovementFormValues>({
    amount: "",
    movementType: "manual_add",
    note: ""
  });
  const [settingsValues, setSettingsValues] = useState<PiggyBankSettingsFormValues>({
    autoMonthlyAmount: summary.settings?.autoMonthlyAmount.toString() ?? "0",
    isAutoEnabled: summary.settings?.isAutoEnabled ?? false,
    startsOnMonth: summary.settings?.startsOnMonth ?? getDefaultMonth()
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setSettingsValues({
      autoMonthlyAmount: summary.settings?.autoMonthlyAmount.toString() ?? "0",
      isAutoEnabled: summary.settings?.isAutoEnabled ?? false,
      startsOnMonth: summary.settings?.startsOnMonth ?? getDefaultMonth()
    });
  }, [summary.settings]);

  return (
    <DashboardShellCard
      title="Salvadanaio"
      subtitle="Fondi vincolati ma inclusi nel patrimonio"
      action={
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <PiggyBank className="h-4 w-4" />
        </div>
      }
      contentClassName="space-y-5"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">Saldo corrente</p>
          <p className="mt-2 font-display text-4xl font-semibold">
            {formatCurrency(summary.balance)}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Incluso nel patrimonio, escluso dal denaro spendibile.
          </p>
        </div>

        <div className="grid gap-2 sm:w-44">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => {
              setActivePanel("movement");
              setMovementValues((current) => ({ ...current, movementType: "manual_add" }));
            }}
          >
            Aggiungi importo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => {
              setActivePanel("movement");
              setMovementValues((current) => ({ ...current, movementType: "manual_release" }));
            }}
          >
            Svincola importo
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-center text-slate-600"
            onClick={() => setActivePanel("settings")}
          >
            Piano mensile
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              activePanel === "movement"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500"
            }`}
            onClick={() => setActivePanel("movement")}
          >
            Movimento manuale
          </button>
          <button
            type="button"
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              activePanel === "settings"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-500"
            }`}
            onClick={() => setActivePanel("settings")}
          >
            Piano mensile
          </button>
        </div>
      </div>

      {activePanel === "movement" ? (
        <form
          className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const nextMessage = await onSubmitMovement(movementValues);
            setMessage(nextMessage);

            if (nextMessage && !nextMessage.toLowerCase().includes("impossibile")) {
              setMovementValues({ amount: "", movementType: "manual_add", note: "" });
            }
          }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <TrendingUp className="h-4 w-4" />
            Movimento manuale
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="piggy-bank-movement-type">Tipo</Label>
              <Select
                id="piggy-bank-movement-type"
                value={movementValues.movementType}
                onChange={(event) =>
                  setMovementValues((current) => ({
                    ...current,
                    movementType:
                      event.target.value === "manual_release" ? "manual_release" : "manual_add"
                  }))
                }
              >
                <option value="manual_add">Aggiungi</option>
                <option value="manual_release">Svincola</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="piggy-bank-amount">Importo</Label>
              <Input
                id="piggy-bank-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={movementValues.amount}
                onChange={(event) =>
                  setMovementValues((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="piggy-bank-note">Nota</Label>
              <Input
                id="piggy-bank-note"
                value={movementValues.note}
                onChange={(event) =>
                  setMovementValues((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="Facoltativa"
              />
            </div>
          </div>
          <Button type="submit" className="w-full sm:w-auto">
            Salva movimento
          </Button>
        </form>
      ) : (
        <form
          className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const nextMessage = await onSubmitSettings(settingsValues);
            setMessage(nextMessage);
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-slate-700">Piano mensile</div>
              <p className="mt-1 text-xs text-slate-500">
                {summary.settings?.isAutoEnabled
                  ? `Attivo da ${summary.settings.startsOnMonth}`
                  : "Nessun piano automatico attivo"}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Importo</p>
              <p className="text-sm font-semibold text-slate-950">
                {formatCurrency(summary.settings?.autoMonthlyAmount ?? 0)}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="piggy-bank-auto-amount">Importo mensile</Label>
              <Input
                id="piggy-bank-auto-amount"
                type="number"
                min="0"
                step="0.01"
                value={settingsValues.autoMonthlyAmount}
                onChange={(event) =>
                  setSettingsValues((current) => ({
                    ...current,
                    autoMonthlyAmount: event.target.value
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="piggy-bank-start-month">Da mese</Label>
              <Input
                id="piggy-bank-start-month"
                type="date"
                value={settingsValues.startsOnMonth}
                onChange={(event) =>
                  setSettingsValues((current) => ({
                    ...current,
                    startsOnMonth: event.target.value
                  }))
                }
              />
            </div>
            <div className="flex items-end">
              <label className="flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={settingsValues.isAutoEnabled}
                  onChange={(event) =>
                    setSettingsValues((current) => ({
                      ...current,
                      isAutoEnabled: event.target.checked
                    }))
                  }
                />
                Piano attivo
              </label>
            </div>
          </div>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Aggiorna piano
          </Button>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">Ultimi movimenti</p>
          {summary.recentMovements.length > 0 ? (
            <button
              type="button"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
              onClick={() => setActivePanel("movement")}
            >
              Nuovo movimento
            </button>
          ) : null}
        </div>
        {summary.recentMovements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-sm text-slate-500">
            Nessun movimento registrato nel salvadanaio.
          </div>
        ) : (
          <div className="space-y-2">
            {summary.recentMovements.slice(0, 3).map((movement) => (
              <div
                key={movement.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {movement.movementType === "manual_release"
                      ? "Svincolo"
                      : movement.movementType === "manual_add"
                        ? "Aggiunta"
                        : "Allocazione automatica"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {movement.movementDate}
                    {movement.note ? ` · ${movement.note}` : ""}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-950">
                  {formatCurrency(movement.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {message ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          {message}
        </div>
      ) : null}
    </DashboardShellCard>
  );
}
