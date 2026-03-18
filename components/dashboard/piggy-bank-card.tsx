"use client";

import { useEffect, useState } from "react";
import { CalendarClock, PiggyBank, TrendingUp } from "lucide-react";

import { DashboardShellCard } from "@/components/dashboard/dashboard-shell-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
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

type PiggyBankModalTab = "manual_add" | "manual_release" | "settings";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function getDefaultMonth() {
  return new Date().toISOString().slice(0, 7) + "-01";
}

const modalTabCopy = {
  manual_add: {
    title: "Aggiungi al salvadanaio",
    description: "Registra un versamento manuale nei fondi vincolati.",
    submitLabel: "Salva aggiunta"
  },
  manual_release: {
    title: "Svincola dal salvadanaio",
    description: "Riporta una parte del saldo nella liquidita disponibile.",
    submitLabel: "Conferma svincolo"
  },
  settings: {
    title: "Piano mensile",
    description: "Configura l'allocazione automatica del salvadanaio.",
    submitLabel: "Salva piano"
  }
} as const;

function MovementForm({
  mode,
  balance,
  values,
  onChange,
  onCancel,
  onSubmit
}: {
  mode: "manual_add" | "manual_release";
  balance: number;
  values: PiggyBankMovementFormValues;
  onChange: (values: PiggyBankMovementFormValues) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}) {
  const copy = modalTabCopy[mode];

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit();
      }}
    >
      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <TrendingUp className="h-4 w-4" />
          {mode === "manual_release" ? "Svincolo manuale" : "Versamento manuale"}
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Saldo attuale: {formatCurrency(balance)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="piggy-bank-amount">Importo</Label>
        <Input
          id="piggy-bank-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={values.amount}
          onChange={(event) =>
            onChange({
              ...values,
              amount: event.target.value,
              movementType: mode
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="piggy-bank-note">Nota</Label>
        <Input
          id="piggy-bank-note"
          value={values.note}
          onChange={(event) =>
            onChange({
              ...values,
              note: event.target.value,
              movementType: mode
            })
          }
          placeholder="Facoltativa"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          {copy.submitLabel}
        </Button>
      </div>
    </form>
  );
}

function SettingsForm({
  values,
  currentAmount,
  currentStatusLabel,
  onChange,
  onCancel,
  onSubmit
}: {
  values: PiggyBankSettingsFormValues;
  currentAmount: number;
  currentStatusLabel: string;
  onChange: (values: PiggyBankSettingsFormValues) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit();
      }}
    >
      <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <CalendarClock className="h-4 w-4" />
              Piano mensile attuale
            </div>
            <p className="mt-2 text-sm text-slate-500">{currentStatusLabel}</p>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Importo</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">
              {formatCurrency(currentAmount)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="piggy-bank-auto-amount">Importo mensile</Label>
          <Input
            id="piggy-bank-auto-amount"
            type="number"
            min="0"
            step="0.01"
            value={values.autoMonthlyAmount}
            onChange={(event) =>
              onChange({
                ...values,
                autoMonthlyAmount: event.target.value
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="piggy-bank-start-month">Da mese</Label>
          <Input
            id="piggy-bank-start-month"
            type="date"
            value={values.startsOnMonth}
            onChange={(event) =>
              onChange({
                ...values,
                startsOnMonth: event.target.value
              })
            }
          />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={values.isAutoEnabled}
          onChange={(event) =>
            onChange({
              ...values,
              isAutoEnabled: event.target.checked
            })
          }
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        <span className="space-y-1">
          <span className="block font-medium text-slate-900">Piano attivo</span>
          <span className="block text-slate-500">
            L&apos;allocazione automatica parte dal mese selezionato.
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
          Annulla
        </Button>
        <Button type="submit" className="w-full sm:w-auto">
          Salva piano
        </Button>
      </div>
    </form>
  );
}

export function PiggyBankCard({
  summary,
  onSubmitMovement,
  onSubmitSettings
}: PiggyBankCardProps) {
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<PiggyBankModalTab>("manual_add");
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

  function openManageModal(tab: PiggyBankModalTab) {
    setActiveTab(tab);

    if (tab === "manual_add" || tab === "manual_release") {
      setMovementValues((current) => ({
        ...current,
        movementType: tab
      }));
    }

    setIsManageModalOpen(true);
  }

  const currentTabCopy = modalTabCopy[activeTab];
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
        <div className="grid gap-4 lg:grid-cols-[1fr_18rem] lg:items-start">
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
              onClick={() => openManageModal("manual_add")}
            >
              Gestisci salvadanaio
            </Button>
            <p className="text-center text-xs text-slate-500">
              Aggiunte, svincoli e piano mensile in un solo punto.
            </p>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <CalendarClock className="h-4 w-4 text-slate-500" />
              Piano mensile
            </div>
            <p className="mt-2 text-sm text-slate-500">{planStatusLabel}</p>
            <p className="mt-4 text-2xl font-semibold text-slate-950">
              {formatCurrency(summary.settings?.autoMonthlyAmount ?? 0)}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <TrendingUp className="h-4 w-4 text-slate-500" />
              Come funziona
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Il saldo del salvadanaio resta incluso nel patrimonio totale, ma viene
              escluso dal denaro spendibile finche non lo svincoli.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Ultimi movimenti</p>
            <button
              type="button"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-800"
              onClick={() => openManageModal("manual_add")}
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
        open={isManageModalOpen}
        onOpenChange={setIsManageModalOpen}
        title={currentTabCopy.title}
        description={currentTabCopy.description}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2 rounded-3xl border border-slate-200 bg-slate-50/80 p-2">
            {([
              ["manual_add", "Aggiungi"],
              ["manual_release", "Svincola"],
              ["settings", "Piano mensile"]
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium transition",
                  activeTab === tab
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                )}
                onClick={() => openManageModal(tab)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "settings" ? (
            <SettingsForm
              values={settingsValues}
              currentAmount={summary.settings?.autoMonthlyAmount ?? 0}
              currentStatusLabel={planStatusLabel}
              onChange={setSettingsValues}
              onCancel={() => setIsManageModalOpen(false)}
              onSubmit={async () => {
                const nextMessage = await onSubmitSettings(settingsValues);
                setMessage(nextMessage);

                if (nextMessage && !nextMessage.toLowerCase().includes("impossibile")) {
                  setIsManageModalOpen(false);
                }
              }}
            />
          ) : (
            <MovementForm
              mode={activeTab}
              balance={summary.balance}
              values={movementValues}
              onChange={setMovementValues}
              onCancel={() => setIsManageModalOpen(false)}
              onSubmit={async () => {
                const nextMessage = await onSubmitMovement({
                  ...movementValues,
                  movementType: activeTab
                });
                setMessage(nextMessage);

                if (nextMessage && !nextMessage.toLowerCase().includes("impossibile")) {
                  setMovementValues({ amount: "", movementType: "manual_add", note: "" });
                  setIsManageModalOpen(false);
                }
              }}
            />
          )}
        </div>
      </Modal>
    </>
  );
}
