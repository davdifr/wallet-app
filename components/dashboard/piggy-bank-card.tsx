"use client";

import { useEffect, useState } from "react";
import { CalendarClock, PiggyBank, TrendingUp } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
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
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
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

  const isMovementRelease = movementValues.movementType === "manual_release";
  const planStatusLabel = summary.settings?.isAutoEnabled
    ? `Attivo da ${summary.settings.startsOnMonth}`
    : "Nessun piano automatico attivo";

  return (
    <>
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
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">Saldo corrente</p>
          <p className="mt-2 font-display text-4xl font-semibold">
            {formatCurrency(summary.balance)}
          </p>
          <p className="mt-2 text-sm text-slate-300">
            Incluso nel patrimonio, escluso dal denaro spendibile.
          </p>
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setMovementValues((current) => ({ ...current, movementType: "manual_add" }));
              setIsMovementModalOpen(true);
            }}
          >
            Aggiungi importo
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setMovementValues((current) => ({ ...current, movementType: "manual_release" }));
              setIsMovementModalOpen(true);
            }}
          >
            Svincola importo
          </Button>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              Piano mensile
            </div>
            <p className="text-sm text-slate-500">{planStatusLabel}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Importo</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatCurrency(summary.settings?.autoMonthlyAmount ?? 0)}
            </p>
          </div>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const nextMessage = await onSubmitSettings(settingsValues);
            setMessage(nextMessage);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={settingsValues.isAutoEnabled}
              onChange={(event) =>
                setSettingsValues((current) => ({
                  ...current,
                  isAutoEnabled: event.target.checked
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="font-medium text-slate-900">Piano attivo</span>
            <span className="text-slate-500">
              L&apos;allocazione automatica parte dal mese selezionato.
            </span>
          </label>

          <div className="flex justify-end">
            <Button type="submit" variant="outline" className="w-full sm:w-auto">
              Aggiorna piano
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-slate-700">Ultimi movimenti</p>
          <button
            type="button"
            className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
            onClick={() => {
              setMovementValues((current) => ({ ...current, movementType: "manual_add" }));
              setIsMovementModalOpen(true);
            }}
          >
            Nuovo movimento
          </button>
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

      <Modal
        open={isMovementModalOpen}
        onOpenChange={setIsMovementModalOpen}
        title={isMovementRelease ? "Svincola dal salvadanaio" : "Aggiungi al salvadanaio"}
        description={
          isMovementRelease
            ? "Sposta una parte del saldo di nuovo nella liquidita disponibile."
            : "Registra un versamento manuale nel salvadanaio."
        }
      >
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            const nextMessage = await onSubmitMovement(movementValues);
            setMessage(nextMessage);

            if (nextMessage && !nextMessage.toLowerCase().includes("impossibile")) {
              setMovementValues({ amount: "", movementType: "manual_add", note: "" });
              setIsMovementModalOpen(false);
            }
          }}
        >
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <TrendingUp className="h-4 w-4" />
              {isMovementRelease ? "Svincolo manuale" : "Versamento manuale"}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Saldo attuale: {formatCurrency(summary.balance)}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="piggy-bank-movement-type">Tipo movimento</Label>
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
                placeholder="0.00"
                value={movementValues.amount}
                onChange={(event) =>
                  setMovementValues((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </div>
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

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setIsMovementModalOpen(false)}
            >
              Annulla
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {isMovementRelease ? "Conferma svincolo" : "Salva movimento"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
