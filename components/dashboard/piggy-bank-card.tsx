"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ChevronDown, ChevronUp, PiggyBank, TrendingUp } from "lucide-react";

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
      <div className="rounded-3xl border border-input bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <TrendingUp className="h-4 w-4" />
          {mode === "manual_release" ? "Svincolo manuale" : "Versamento manuale"}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
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
      <div className="rounded-3xl border border-input bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarClock className="h-4 w-4" />
              Piano mensile attuale
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{currentStatusLabel}</p>
          </div>
          <div className="rounded-2xl border border-input px-4 py-3 text-right">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Importo</p>
            <p className="mt-1 text-lg font-semibold text-foreground">
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

      <label className="flex items-start gap-3 rounded-2xl border border-input bg-card px-4 py-3 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.isAutoEnabled}
          onChange={(event) =>
            onChange({
              ...values,
              isAutoEnabled: event.target.checked
            })
          }
          className="mt-0.5 h-4 w-4 rounded border-input"
        />
        <span className="space-y-1">
          <span className="block font-medium text-foreground">Piano attivo</span>
          <span className="block text-muted-foreground">
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
  const [isExpanded, setIsExpanded] = useState(false);
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
        action={
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-white/[0.04] text-slate-400 transition hover:text-white"
            aria-label={isExpanded ? "Comprimi salvadanaio" : "Espandi salvadanaio"}
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        }
        contentClassName="space-y-4"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-[1.1rem] bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Protetto</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-[#7DF4C2]">
                {formatCurrency(summary.balance)}
              </p>
            </div>
            <div className="rounded-[1.1rem] bg-white/[0.03] p-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Piano</p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-white">
                {formatCurrency(summary.settings?.autoMonthlyAmount ?? 0)}
              </p>
            </div>
            <div className="rounded-[1.1rem] bg-white/[0.03] p-4 sm:col-span-1 col-span-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Stato</p>
              <p className="mt-2 text-sm font-medium text-slate-300">
                {summary.settings?.isAutoEnabled ? "Piano attivo" : "Solo manuale"}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Button type="button" className="w-full sm:w-auto" onClick={() => openManageModal("manual_add")}>
              Gestisci
            </Button>
          </div>
        </div>

        {isExpanded ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] bg-[#0D1320] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <PiggyBank className="h-4 w-4 text-slate-400" />
                  Saldo protetto
                </div>
                <p className="mt-2 font-display text-[2rem] font-semibold tracking-tight text-[#7DF4C2]">
              {formatCurrency(summary.balance)}
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Non rientra nel denaro spendibile di oggi.
                </p>
              </div>

              <div className="rounded-[1.2rem] bg-[#0D1320] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <CalendarClock className="h-4 w-4 text-slate-400" />
                  Piano mensile
                </div>
                <p className="mt-2 text-sm text-slate-400">{planStatusLabel}</p>
                <p className="mt-4 text-xl font-semibold tracking-tight text-white">
                  {formatCurrency(summary.settings?.autoMonthlyAmount ?? 0)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">Ultimi movimenti</p>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-400 transition"
                  onClick={() => openManageModal("manual_add")}
                >
                  Nuovo movimento
                </button>
              </div>
              {summary.recentMovements.length === 0 ? (
                <div className="rounded-[1.1rem] border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">
                  Nessun movimento registrato nel salvadanaio.
                </div>
              ) : (
                <div className="space-y-2">
                  {summary.recentMovements.slice(0, 2).map((movement) => (
                    <div
                      key={movement.id}
                      className="flex items-center justify-between rounded-[1.1rem] bg-white/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {movement.movementType === "manual_release"
                            ? "Svincolo"
                            : movement.movementType === "manual_add"
                              ? "Aggiunta"
                              : "Allocazione automatica"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {movement.movementDate}
                          {movement.note ? ` · ${movement.note}` : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(movement.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}

        {message ? (
          <div className="rounded-[1.1rem] bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
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
          <div className="grid grid-cols-3 gap-2 rounded-[1.2rem] bg-[#0D1320] p-2">
            {([
              ["manual_add", "Aggiungi"],
              ["manual_release", "Svincola"],
              ["settings", "Piano mensile"]
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "rounded-[1rem] px-4 py-3 text-sm font-medium transition",
                  activeTab === tab
                    ? "bg-white text-[#08121F]"
                    : "text-slate-400 hover:text-white"
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
