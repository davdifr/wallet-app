"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { distributeExpenseByWeights } from "@/lib/group-expenses/calculations";
import { createSharedExpenseSchema } from "@/lib/validations/group-expense";
import { cn } from "@/lib/utils";
import type {
  CreateSharedExpenseFormValues,
  GroupFormState,
  GroupMember
} from "@/types/group-expenses";

type SharedExpenseFormProps = {
  currentUserId: string | null;
  groupId: string;
  members: GroupMember[];
  isSubmitting?: boolean;
  onSubmit: (values: CreateSharedExpenseFormValues) => Promise<GroupFormState>;
};

type WeightMap = Record<string, number>;

const TOTAL_PERCENT = 100;

function createEqualWeights(members: GroupMember[]) {
  if (members.length === 0) {
    return {};
  }

  const base = Math.floor(TOTAL_PERCENT / members.length);
  const remainder = TOTAL_PERCENT - base * members.length;

  return Object.fromEntries(
    members.map((member, index) => [
      member.id,
      base + (index === members.length - 1 ? remainder : 0)
    ])
  );
}

function rebalanceWeights(
  currentWeights: WeightMap,
  memberIds: string[],
  changedMemberId: string,
  nextValue: number
) {
  const clampedValue = Math.max(0, Math.min(TOTAL_PERCENT, nextValue));
  const otherIds = memberIds.filter((id) => id !== changedMemberId);

  if (otherIds.length === 0) {
    return { [changedMemberId]: TOTAL_PERCENT };
  }

  const remaining = TOTAL_PERCENT - clampedValue;
  const previousOtherTotal = otherIds.reduce((sum, id) => sum + (currentWeights[id] ?? 0), 0);
  const nextWeights: WeightMap = {
    ...currentWeights,
    [changedMemberId]: clampedValue
  };

  if (previousOtherTotal <= 0) {
    const base = Math.floor(remaining / otherIds.length);
    const remainder = remaining - base * otherIds.length;

    otherIds.forEach((id, index) => {
      nextWeights[id] = base + (index === otherIds.length - 1 ? remainder : 0);
    });

    return nextWeights;
  }

  let assigned = 0;

  otherIds.forEach((id, index) => {
    if (index === otherIds.length - 1) {
      nextWeights[id] = remaining - assigned;
      return;
    }

    const proportional = Math.round(((currentWeights[id] ?? 0) / previousOtherTotal) * remaining);
    nextWeights[id] = proportional;
    assigned += proportional;
  });

  return nextWeights;
}

const emptyBaseValues = {
  title: "",
  description: "",
  amount: "",
  expenseDate: "",
  splitMethod: "equal" as const
};

export function SharedExpenseForm({
  currentUserId,
  groupId,
  members,
  isSubmitting = false,
  onSubmit
}: SharedExpenseFormProps) {
  const [state, setState] = useState<GroupFormState>({ success: false });
  const [splitMethod, setSplitMethod] = useState<"equal" | "custom">("equal");
  const [amount, setAmount] = useState("");
  const [weights, setWeights] = useState<WeightMap>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [paidByMemberId, setPaidByMemberId] = useState("");
  const defaultPaidByMemberId = useMemo(
    () => members.find((member) => member.userId === currentUserId)?.id ?? members[0]?.id ?? "",
    [currentUserId, members]
  );

  useEffect(() => {
    setWeights(createEqualWeights(members));
    setPaidByMemberId((current) => current || defaultPaidByMemberId);
  }, [defaultPaidByMemberId, members]);

  const weightedSplit = useMemo(
    () =>
      distributeExpenseByWeights(
        Number(amount || "0"),
        members.map((member) => ({
          groupMemberId: member.id,
          weight: weights[member.id] ?? 0
        }))
      ),
    [amount, members, weights]
  );

  const splitValues = useMemo(() => JSON.stringify(weightedSplit), [weightedSplit]);

  return (
    <form
      className="space-y-4 rounded-3xl border border-input bg-card p-4"
      onSubmit={async (event) => {
        event.preventDefault();

        const values: CreateSharedExpenseFormValues = {
          groupId,
          title,
          description,
          amount,
          expenseDate,
          splitMethod,
          paidByMemberId,
          splitValues
        };

        const parsed = createSharedExpenseSchema.safeParse(values);

        if (!parsed.success) {
          setState({
            success: false,
            message: "Controlla i dati della spesa condivisa.",
            errors: parsed.error.flatten().fieldErrors
          });
          return;
        }

        const nextState = await onSubmit(parsed.data);
        setState(nextState);

        if (nextState.success) {
          setTitle(emptyBaseValues.title);
          setDescription(emptyBaseValues.description);
          setAmount(emptyBaseValues.amount);
          setExpenseDate(emptyBaseValues.expenseDate);
          setSplitMethod(emptyBaseValues.splitMethod);
          setWeights(createEqualWeights(members));
          setPaidByMemberId(defaultPaidByMemberId);
        }
      }}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`title-${groupId}`}>Titolo</Label>
          <Input
            id={`title-${groupId}`}
            placeholder="Cena, affitto, taxi..."
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`amount-${groupId}`}>Importo</Label>
          <Input
            id={`amount-${groupId}`}
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`description-${groupId}`}>Descrizione</Label>
        <Textarea
          id={`description-${groupId}`}
          className="min-h-20"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`expenseDate-${groupId}`}>Data</Label>
          <Input
            id={`expenseDate-${groupId}`}
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`paidBy-${groupId}`}>Ha pagato</Label>
          <Select
            id={`paidBy-${groupId}`}
            value={paidByMemberId}
            onChange={(event) => setPaidByMemberId(event.target.value)}
          >
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.displayName}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`splitMethod-${groupId}`}>Divisione</Label>
          <Select
            id={`splitMethod-${groupId}`}
            value={splitMethod}
            onChange={(event) =>
              setSplitMethod(event.target.value === "custom" ? "custom" : "equal")
            }
          >
            <option value="equal">Equa</option>
            <option value="custom">Personalizzata</option>
          </Select>
        </div>
      </div>

      {splitMethod === "custom" ? (
        <div className="space-y-3 rounded-3xl border border-input bg-background p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">Divisione con slider</p>
            <p className="text-xs text-muted-foreground">
              La somma resta sempre al 100% e gli altri membri si adattano automaticamente
            </p>
          </div>

          {members.map((member) => {
            const allocatedAmount =
              weightedSplit.find((item) => item.groupMemberId === member.id)?.amount ?? 0;
            const percentage = weights[member.id] ?? 0;

            return (
              <div
                key={member.id}
                className="rounded-2xl border border-input bg-card p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label htmlFor={`split-${member.id}`}>{member.displayName}</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {percentage}% · quota € {allocatedAmount.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-foreground">
                    € {allocatedAmount.toFixed(2)}
                  </span>
                </div>

                <input
                  id={`split-${member.id}`}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={percentage}
                  onChange={(event) =>
                    setWeights((current) =>
                      rebalanceWeights(
                        current,
                        members.map((item) => item.id),
                        member.id,
                        Number(event.target.value)
                      )
                    )
                  }
                  className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-foreground"
                />
              </div>
            );
          })}
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border px-3 py-2 text-xs",
          state.success
            ? "border-input bg-muted text-foreground"
            : state.message
              ? "border-input bg-muted text-foreground"
              : "hidden"
        )}
      >
        {state.message}
      </div>

      <Button type="submit" size="sm" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Salvataggio..." : "Crea spesa condivisa"}
      </Button>
    </form>
  );
}
