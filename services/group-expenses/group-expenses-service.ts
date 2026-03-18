import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  calculateGroupBalanceSummary,
  distributeExpenseEqually,
  parseCustomSplitValues
} from "@/lib/group-expenses/calculations";
import type { Database } from "@/types/database";
import type {
  AddGroupMemberFormValues,
  CreateGroupFormValues,
  GroupDetails,
  CreateSharedExpenseFormValues,
  Group,
  GroupBalanceSummary,
  GroupMember,
  Settlement,
  SettleSplitFormValues,
  SharedExpense,
  SharedExpenseSplit,
  UserInviteCandidate
} from "@/types/group-expenses";

type GroupRow = Database["public"]["Tables"]["groups"]["Row"];
type GroupInsert = Database["public"]["Tables"]["groups"]["Insert"];
type GroupMemberRow = Database["public"]["Tables"]["group_members"]["Row"];
type GroupMemberInsert = Database["public"]["Tables"]["group_members"]["Insert"];
type SharedExpenseRow = Database["public"]["Tables"]["shared_expenses"]["Row"];
type SharedExpenseInsert = Database["public"]["Tables"]["shared_expenses"]["Insert"];
type SharedExpenseSplitRow = Database["public"]["Tables"]["shared_expense_splits"]["Row"];
type SharedExpenseSplitInsert =
  Database["public"]["Tables"]["shared_expense_splits"]["Insert"];
type SharedExpenseSplitUpdate =
  Database["public"]["Tables"]["shared_expense_splits"]["Update"];
type SettlementRow = Database["public"]["Tables"]["settlements"]["Row"];
type SettlementInsert = Database["public"]["Tables"]["settlements"]["Insert"];
type SettlementUpdate = Database["public"]["Tables"]["settlements"]["Update"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

class GroupExpensesServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "GroupExpensesServiceError";
    this.statusCode = statusCode;
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

type InvitableUserRow = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url?: string | null;
};

type UserDirectoryRpcClient = {
  rpc: (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { code?: string; message: string } | null }>;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function mapGroupMember(row: {
  id: string;
  group_id: string;
  user_id: string | null;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  guest_email: string | null;
  is_guest: boolean;
  role: "owner" | "admin" | "member";
  joined_at: string;
}): GroupMember {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    displayName: row.display_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    guestEmail: row.guest_email,
    isGuest: row.is_guest,
    role: row.role,
    joinedAt: row.joined_at
  };
}

function mapSharedExpenseSplit(row: {
  id: string;
  shared_expense_id: string;
  group_member_id: string | null;
  amount: number;
  settled_amount: number;
  is_paid: boolean;
}): SharedExpenseSplit {
  return {
    id: row.id,
    expenseId: row.shared_expense_id,
    groupMemberId: row.group_member_id ?? "",
    amount: row.amount,
    settledAmount: row.settled_amount,
    isPaid: row.is_paid
  };
}

async function getOwnedGroup(userId: string, groupId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new GroupExpensesServiceError("Gruppo non trovato.", 404);
    }

    throw new Error(error.message);
  }

  const group = data as GroupRow;

  if (group.owner_user_id !== userId) {
    throw new GroupExpensesServiceError(
      "Solo il proprietario del gruppo puo eliminarlo.",
      403
    );
  }

  return group;
}

async function applySettlementToSplit(
  splitId: string,
  settlementAmount: number
) {
  const supabase = await createSupabaseServerClient();
  const { data: split, error: splitError } = await supabase
    .from("shared_expense_splits")
    .select("id, amount, settled_amount")
    .eq("id", splitId)
    .single();

  if (splitError) {
    throw new Error(splitError.message);
  }

  const splitRow = split as Pick<SharedExpenseSplitRow, "id" | "amount"> & {
    settled_amount: number;
  };
  const currentSettledAmount = splitRow.settled_amount ?? 0;
  const availableAmount = roundCurrency(splitRow.amount - currentSettledAmount);

  if (settlementAmount - availableAmount > 0.009) {
    throw new Error("La quota e gia stata saldata o coperta da altri rimborsi.");
  }

  const nextSettledAmount = roundCurrency(currentSettledAmount + settlementAmount);

  const { error: updateError } = await supabase
    .from("shared_expense_splits")
    .update({
      settled_amount: nextSettledAmount,
      is_paid: nextSettledAmount >= splitRow.amount,
      settled_at:
        nextSettledAmount >= splitRow.amount ? new Date().toISOString() : null
    } as SharedExpenseSplitUpdate as never)
    .eq("id", splitId);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

async function syncSharedExpenseTransaction(expense: {
  id: string;
  groupId: string;
  paidByUserId: string | null;
  amount: number;
  expenseDate: string;
  title: string;
  description: string | null;
}) {
  if (!expense.paidByUserId) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const payload: TransactionInsert = {
    user_id: expense.paidByUserId,
    group_id: expense.groupId,
    transaction_type: "expense",
    status: "cleared",
    amount: expense.amount,
    currency: "EUR",
    transaction_date: expense.expenseDate,
    description: expense.title,
    category: "Group expense",
    notes: expense.description,
    is_shared: true,
    shared_expense_id: expense.id,
    settlement_id: null
  };

  const { error } = await supabase.from("transactions").insert(payload as never);
  if (error) {
    throw new Error(error.message);
  }
}

async function syncSettlementTransactions(input: {
  settlementId: string;
  groupId: string;
  amount: number;
  settlementDate: string;
  title: string;
  note: string | null;
  payerUserId: string | null;
  payeeUserId: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const payload: TransactionInsert[] = [];

  if (input.payerUserId) {
    payload.push({
      user_id: input.payerUserId,
      group_id: input.groupId,
      transaction_type: "expense",
      status: "cleared",
      amount: input.amount,
      currency: "EUR",
      transaction_date: input.settlementDate,
      description: `Quota gruppo · ${input.title}`,
      category: "Group settlement",
      notes: input.note,
      is_shared: true,
      shared_expense_id: null,
      settlement_id: input.settlementId
    });
  }

  if (input.payeeUserId) {
    payload.push({
      user_id: input.payeeUserId,
      group_id: input.groupId,
      transaction_type: "income",
      status: "cleared",
      amount: input.amount,
      currency: "EUR",
      transaction_date: input.settlementDate,
      description: `Rimborso gruppo · ${input.title}`,
      category: "Group settlement",
      notes: input.note,
      is_shared: true,
      shared_expense_id: null,
      settlement_id: input.settlementId
    });
  }

  if (payload.length === 0) {
    return;
  }

  const { error } = await supabase.from("transactions").insert(payload as never);
  if (error) {
    throw new Error(error.message);
  }
}

export async function listGroupsWithDetails(options?: {
  groupId?: string;
}): Promise<GroupDetails[]> {
  const supabase = await createSupabaseServerClient();
  const groupId = options?.groupId ?? null;

  const groupsQuery = supabase.from("groups").select("*").order("created_at", { ascending: false });
  const membersQuery = supabase
    .from("group_members")
    .select("*")
    .order("created_at", { ascending: true });
  const expensesQuery = supabase
    .from("shared_expenses")
    .select("*")
    .order("expense_date", { ascending: false });
  const splitsQuery = supabase
    .from("shared_expense_splits")
    .select("*")
    .order("created_at", { ascending: true });
  const settlementsQuery = supabase
    .from("settlements")
    .select("*")
    .not("payer_member_id", "is", null)
    .not("payee_member_id", "is", null)
    .order("settlement_date", { ascending: false });

  const filteredGroupsQuery = groupId ? groupsQuery.eq("id", groupId) : groupsQuery;
  const filteredMembersQuery = groupId ? membersQuery.eq("group_id", groupId) : membersQuery;
  const filteredExpensesQuery = groupId ? expensesQuery.eq("group_id", groupId) : expensesQuery;
  const filteredSettlementsQuery = groupId
    ? settlementsQuery.eq("group_id", groupId)
    : settlementsQuery;

  const [
    { data: groups, error: groupsError },
    { data: members, error: membersError },
    { data: expenses, error: expensesError },
    { data: splits, error: splitsError },
    { data: settlements, error: settlementsError }
  ] = await Promise.all([
    filteredGroupsQuery,
    filteredMembersQuery,
    filteredExpensesQuery,
    splitsQuery,
    filteredSettlementsQuery
  ]);

  if (groupsError) throw new Error(groupsError.message);
  if (membersError) throw new Error(membersError.message);
  if (expensesError) throw new Error(expensesError.message);
  if (splitsError) throw new Error(splitsError.message);
  if (settlementsError) throw new Error(settlementsError.message);

  const groupRows: GroupRow[] = groups ?? [];
  const memberRows: GroupMemberRow[] = members ?? [];
  const expenseRows: SharedExpenseRow[] = expenses ?? [];
  const splitRowsData: SharedExpenseSplitRow[] = splits ?? [];
  const settlementRows: SettlementRow[] = settlements ?? [];

  const mappedMembers = memberRows.map((item) =>
    mapGroupMember({
      id: item.id,
      group_id: item.group_id,
      user_id: item.user_id,
      display_name:
        (item as { display_name?: string }).display_name ??
        (item as { displayName?: string }).displayName ??
        "Member",
      email: null,
      avatar_url: null,
      guest_email:
        (item as { guest_email?: string | null }).guest_email ??
        (item as { guestEmail?: string | null }).guestEmail ??
        null,
      is_guest:
        (item as { is_guest?: boolean }).is_guest ??
        (item as { isGuest?: boolean }).isGuest ??
        false,
      role: item.role,
      joined_at: item.joined_at
    })
  );

  const userIds = Array.from(
    new Set(
      mappedMembers
        .map((member) => member.userId)
        .filter((userId): userId is string => typeof userId === "string" && userId.length > 0)
    )
  );

  let usersById = new Map<
    string,
    { email: string; full_name: string | null; avatar_url: string | null }
  >();

  if (userIds.length > 0) {
    const { data: users, error: usersError } = await (supabase as typeof supabase &
      UserDirectoryRpcClient).rpc("get_user_directory_profiles", {
      user_ids: userIds
    });

    if (usersError) {
      throw new Error(usersError.message);
    }

    usersById = new Map(
      ((users ?? []) as Array<{
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
      }>).map((user) => [user.id, user])
    );
  }

  const enrichedMembers = mappedMembers.map((member) => {
    const profile = member.userId ? usersById.get(member.userId) : null;
    const normalizedDisplayName =
      !member.isGuest &&
      profile &&
      (member.displayName === "Owner" || member.displayName === "Member")
        ? profile.full_name ?? profile.email
        : member.displayName;

    return {
      ...member,
      displayName: normalizedDisplayName,
      email: member.isGuest ? member.guestEmail : profile?.email ?? null,
      avatarUrl: member.isGuest ? null : profile?.avatar_url ?? null
    };
  });

  return groupRows.map((group) => {
    const groupMembers = enrichedMembers.filter((member) => member.groupId === group.id);
    const groupExpenses: SharedExpense[] = expenseRows
      .filter((expense) => expense.group_id === group.id)
      .map((expense) => {
        const expenseSplits = splitRowsData
          .filter((split) => split.shared_expense_id === expense.id)
          .map((split) => {
            const mappedSplit = mapSharedExpenseSplit({
              id: split.id,
              shared_expense_id: split.shared_expense_id,
              group_member_id:
                (split as { group_member_id?: string | null }).group_member_id ?? null,
              amount: split.amount,
              settled_amount:
                (split as { settled_amount?: number }).settled_amount ?? 0,
              is_paid: split.is_paid
            });

            return {
              ...mappedSplit,
              member: groupMembers.find((member) => member.id === mappedSplit.groupMemberId)
            };
          });

        return {
          id: expense.id,
          groupId: expense.group_id,
          title: expense.title,
          description: expense.description ?? "",
          amount: expense.amount,
          expenseDate: expense.expense_date,
          splitMethod:
            expense.split_method === "custom" ? "custom" : "equal",
          paidByMemberId:
            (expense as { paid_by_member_id?: string | null }).paid_by_member_id ??
            "",
          paidByMember: groupMembers.find(
            (member) =>
              member.id ===
              ((expense as { paid_by_member_id?: string | null }).paid_by_member_id ?? "")
          ),
          splits: expenseSplits
        };
      });

    const groupSettlements: Settlement[] = settlementRows
      .filter((settlement) => settlement.group_id === group.id)
      .map((settlement) => ({
        id: settlement.id,
        groupId: settlement.group_id,
        sharedExpenseId: settlement.shared_expense_id,
        sharedExpenseSplitId:
          (settlement as { shared_expense_split_id?: string | null }).shared_expense_split_id ??
          null,
        payerMemberId:
          (settlement as { payer_member_id?: string | null }).payer_member_id ?? "",
        payeeMemberId:
          (settlement as { payee_member_id?: string | null }).payee_member_id ?? "",
        payerUserId: settlement.payer_user_id,
        payeeUserId: settlement.payee_user_id,
        amount: settlement.amount,
        settlementDate: settlement.settlement_date,
        status: settlement.status,
        createdByUserId:
          (settlement as { created_by_user_id?: string }).created_by_user_id ?? "",
        acceptedByUserId:
          (settlement as { accepted_by_user_id?: string | null }).accepted_by_user_id ?? null,
        acceptedAt:
          (settlement as { accepted_at?: string | null }).accepted_at ?? null,
        note: settlement.note ?? ""
      }));

    const groupData: Group = {
      id: group.id,
      name: group.name,
      description: group.description ?? "",
      currency: group.currency,
      createdAt: group.created_at,
      members: groupMembers
    };

    return {
      group: groupData,
      expenses: groupExpenses,
      settlements: groupSettlements,
      summary: calculateGroupBalanceSummary(groupMembers, groupExpenses, groupSettlements)
    };
  });
}

export async function getGroupWithDetails(groupId: string): Promise<GroupDetails | null> {
  const groups = await listGroupsWithDetails({ groupId });
  return groups[0] ?? null;
}

export async function listUserInviteCandidates(): Promise<UserInviteCandidate[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await (supabase as typeof supabase & UserDirectoryRpcClient).rpc(
    "search_invitable_users",
    {
    search_query: null
    }
  );

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as InvitableUserRow[];

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name
  }));
}

export async function createGroup(userId: string, values: CreateGroupFormValues) {
  const supabase = await createSupabaseServerClient();
  const payload: GroupInsert = {
    owner_user_id: userId,
    name: values.name,
    description: values.description || null,
    currency: "EUR"
  };
  const { error } = await supabase.from("groups").insert(payload as never);

  if (error) throw new Error(error.message);
}

export async function deleteGroup(userId: string, groupId: string) {
  const group = await getOwnedGroup(userId, groupId);
  const supabase = await createSupabaseServerClient();

  // Manteniamo le transazioni sincronizzate nel wallet personale, ma le sganciamo
  // dal contesto gruppo prima della cancellazione a cascata dello storico condiviso.
  const { error: transactionsUpdateError } = await supabase
    .from("transactions")
    .update({
      group_id: null,
      is_shared: false,
      shared_expense_id: null,
      settlement_id: null
    } as TransactionUpdate as never)
    .eq("group_id", groupId);

  if (transactionsUpdateError) {
    throw new Error(transactionsUpdateError.message);
  }

  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    throw new Error(error.message);
  }

  return group;
}

export async function removeGroupMember(
  actorUserId: string,
  groupId: string,
  memberId: string
) {
  await getOwnedGroup(actorUserId, groupId);
  const supabase = await createSupabaseServerClient();

  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .select("*")
    .eq("id", memberId)
    .eq("group_id", groupId)
    .single();

  if (memberError) {
    if (memberError.code === "PGRST116") {
      throw new GroupExpensesServiceError("Membro non trovato.", 404);
    }

    throw new Error(memberError.message);
  }

  const memberRow = member as GroupMemberRow;

  if (memberRow.role === "owner") {
    throw new GroupExpensesServiceError(
      "Non puoi rimuovere il proprietario del gruppo.",
      409
    );
  }

  const [
    { count: paidExpensesCount, error: paidExpensesError },
    { count: splitCount, error: splitError },
    { count: settlementsCount, error: settlementsError }
  ] = await Promise.all([
    supabase
      .from("shared_expenses")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("paid_by_member_id", memberId),
    supabase
      .from("shared_expense_splits")
      .select("id", { count: "exact", head: true })
      .eq("group_member_id", memberId),
    supabase
      .from("settlements")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .or(`payer_member_id.eq.${memberId},payee_member_id.eq.${memberId}`)
  ]);

  if (paidExpensesError) throw new Error(paidExpensesError.message);
  if (splitError) throw new Error(splitError.message);
  if (settlementsError) throw new Error(settlementsError.message);

  if ((paidExpensesCount ?? 0) > 0 || (splitCount ?? 0) > 0 || (settlementsCount ?? 0) > 0) {
    throw new GroupExpensesServiceError(
      "Puoi rimuovere solo partecipanti senza spese, quote o rimborsi gia registrati.",
      409
    );
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("id", memberId)
    .eq("group_id", groupId);

  if (error) {
    throw new Error(error.message);
  }

  return mapGroupMember({
    id: memberRow.id,
    group_id: memberRow.group_id,
    user_id: memberRow.user_id,
    display_name: memberRow.display_name,
    email: null,
    avatar_url: null,
    guest_email: memberRow.guest_email,
    is_guest: memberRow.is_guest,
    role: memberRow.role,
    joined_at: memberRow.joined_at
  });
}

export async function addGroupMember(values: AddGroupMemberFormValues) {
  const supabase = await createSupabaseServerClient();
  let payload: GroupMemberInsert;

  if (values.memberType === "guest") {
    payload = {
      group_id: values.groupId,
      user_id: null,
      display_name: values.displayName,
      guest_email: values.guestEmail || null,
      is_guest: true,
      role: "member" as const
    };
  } else {
    const normalizedEmail = normalizeEmail(values.email);
    const { data: users, error: userError } = await (supabase as typeof supabase &
      UserDirectoryRpcClient).rpc("search_invitable_users", { search_query: normalizedEmail });

    if (userError) {
      throw new Error(userError.message);
    }

    const exactMatches = ((users ?? []) as InvitableUserRow[]).filter(
      (user) => normalizeEmail(user.email) === normalizedEmail
    );

    if (exactMatches.length === 0) {
      throw new GroupExpensesServiceError(
        "Nessun utente dell'app trovato con questa email.",
        404
      );
    }

    if (exactMatches.length > 1) {
      throw new GroupExpensesServiceError(
        "Abbiamo trovato piu utenti con questa email. Seleziona un suggerimento dalla lista.",
        409
      );
    }

    const appUser = exactMatches[0] as {
      id: string;
      email: string;
      full_name: string | null;
    };

    const { data: groupMember, error: existingMemberError } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", values.groupId)
      .eq("is_guest", false)
      .eq("user_id", appUser.id)
      .maybeSingle();

    if (existingMemberError && existingMemberError.code !== "PGRST116") {
      throw new Error(existingMemberError.message);
    }

    if (groupMember) {
      throw new GroupExpensesServiceError("Questo utente fa gia parte del gruppo.", 409);
    }

    payload = {
      group_id: values.groupId,
      user_id: appUser.id,
      display_name: appUser.full_name ?? appUser.email,
      guest_email: null,
      is_guest: false,
      role: "member" as const
    };
  }

  const { error } = await supabase.from("group_members").insert(payload as never);
  if (error) throw new Error(error.message);
}

export async function createSharedExpense(
  userId: string,
  values: CreateSharedExpenseFormValues
) {
  const supabase = await createSupabaseServerClient();
  const amount = Number(values.amount);
  const expenseId = crypto.randomUUID();

  const { data: groupMembers, error: membersError } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", values.groupId);

  if (membersError) throw new Error(membersError.message);

  const memberRows: GroupMemberRow[] = groupMembers ?? [];

  const parsedCustomSplits = parseCustomSplitValues(values.splitValues);
  const splitRows =
    values.splitMethod === "equal"
      ? distributeExpenseEqually(
          amount,
          memberRows.map((member) => member.id)
        )
      : parsedCustomSplits;

  const splitSum = splitRows.reduce((sum, split) => sum + split.amount, 0);

  if (Math.abs(splitSum - amount) > 0.01) {
    throw new Error("La somma delle quote deve corrispondere all'importo totale.");
  }

  const paidByMember =
    memberRows.find((member) => member.id === values.paidByMemberId) ?? null;

  if (!paidByMember) {
    throw new Error("Il membro che ha pagato non appartiene al gruppo.");
  }

  const expensePayload: SharedExpenseInsert = {
    id: expenseId,
    group_id: values.groupId,
    created_by_user_id: userId,
    paid_by_user_id: paidByMember.user_id,
    paid_by_member_id: values.paidByMemberId,
    title: values.title,
    description: values.description || null,
    amount,
    expense_date: values.expenseDate,
    split_method: values.splitMethod,
    currency: "EUR",
    status: "posted"
  };

  const { error: expenseError } = await supabase
    .from("shared_expenses")
    .insert(expensePayload as never);

  if (expenseError) throw new Error(expenseError.message);

  const splitPayload: SharedExpenseSplitInsert[] = splitRows.map((split) => ({
      shared_expense_id: expenseId,
      user_id:
        memberRows.find((member) => member.id === split.groupMemberId)?.user_id ?? null,
      group_member_id: split.groupMemberId,
      amount: split.amount,
      settled_amount: 0,
      is_paid: false
    }));

  const { error: splitsError } = await supabase
    .from("shared_expense_splits")
    .insert(splitPayload as never);

  if (splitsError) throw new Error(splitsError.message);

  await syncSharedExpenseTransaction({
    id: expenseId,
    groupId: values.groupId,
    paidByUserId: paidByMember.user_id,
    amount,
    expenseDate: values.expenseDate,
    title: values.title,
    description: values.description || null
  });
}

export async function settleSharedExpenseSplit(
  actorUserId: string,
  values: SettleSplitFormValues
) {
  const supabase = await createSupabaseServerClient();
  const amount = Number(values.amount);

  const [
    { data: split, error: splitError },
    { data: expense, error: expenseError },
    { data: members, error: membersError },
    { data: pendingSettlements, error: pendingError }
  ] = await Promise.all([
    supabase
      .from("shared_expense_splits")
      .select("*")
      .eq("id", values.splitId)
      .single(),
    supabase
      .from("shared_expenses")
      .select("id, title")
      .eq("id", values.expenseId)
      .single(),
    supabase
      .from("group_members")
      .select("id, user_id, is_guest")
      .in("id", [values.payerMemberId, values.payeeMemberId]),
    supabase
      .from("settlements")
      .select("amount")
      .eq("shared_expense_split_id", values.splitId)
      .eq("status", "pending")
  ]);

  if (splitError) throw new Error(splitError.message);
  if (expenseError) throw new Error(expenseError.message);
  if (membersError) throw new Error(membersError.message);
  if (pendingError) throw new Error(pendingError.message);

  const splitRow = split as SharedExpenseSplitRow;
  const splitCurrentSettledAmount =
    (splitRow as { settled_amount?: number }).settled_amount ?? 0;
  const pendingSettlementRows = (pendingSettlements ?? []) as Array<{ amount: number }>;
  const pendingAmount = roundCurrency(
    pendingSettlementRows.reduce((sum, item) => sum + item.amount, 0)
  );
  const availableAmount = roundCurrency(
    splitRow.amount - splitCurrentSettledAmount - pendingAmount
  );

  if (amount - availableAmount > 0.009) {
    throw new Error("L'importo supera il residuo disponibile per questa quota.");
  }

  const memberRows = (members ?? []) as Array<{
    id: string;
    user_id: string | null;
    is_guest: boolean;
  }>;
  const payerMember = memberRows.find((member) => member.id === values.payerMemberId);
  const payeeMember = memberRows.find((member) => member.id === values.payeeMemberId);

  if (!payerMember || !payeeMember) {
    throw new Error("Impossibile trovare i membri coinvolti nel rimborso.");
  }

  const shouldCompleteImmediately =
    payerMember.is_guest ||
    payeeMember.is_guest ||
    actorUserId === payerMember.user_id ||
    actorUserId === payeeMember.user_id;
  const settlementDate = getTodayDate();
  const settlementId = crypto.randomUUID();

  const settlementPayload: SettlementInsert = {
    id: settlementId,
    group_id: values.groupId,
    shared_expense_id: values.expenseId,
    shared_expense_split_id: values.splitId,
    created_by_user_id: actorUserId,
    accepted_by_user_id: shouldCompleteImmediately ? actorUserId : null,
    payer_user_id: payerMember.user_id,
    payee_user_id: payeeMember.user_id,
    payer_member_id: values.payerMemberId,
    payee_member_id: values.payeeMemberId,
    amount,
    currency: "EUR",
    settlement_date: settlementDate,
    status: shouldCompleteImmediately ? "completed" : "pending",
    accepted_at: shouldCompleteImmediately ? new Date().toISOString() : null,
    note: values.note || null
  };

  const { error: settlementError } = await supabase
    .from("settlements")
    .insert(settlementPayload as never);

  if (settlementError) throw new Error(settlementError.message);

  if (shouldCompleteImmediately) {
    await applySettlementToSplit(values.splitId, amount);
    await syncSettlementTransactions({
      settlementId,
      groupId: values.groupId,
      amount,
      settlementDate,
      title: (expense as { title: string }).title,
      note: values.note || null,
      payerUserId: payerMember.user_id,
      payeeUserId: payeeMember.user_id
    });
  }

  return {
    status: shouldCompleteImmediately ? "completed" : "pending"
  };
}

export async function acceptSettlement(actorUserId: string, settlementId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: settlement, error: settlementError } = await supabase
    .from("settlements")
    .select("*, shared_expenses(title)")
    .eq("id", settlementId)
    .single();

  if (settlementError) {
    throw new Error(settlementError.message);
  }

  const settlementRow = settlement as SettlementRow & {
    accepted_at?: string | null;
    accepted_by_user_id?: string | null;
    created_by_user_id: string;
    payer_member_id?: string | null;
    payee_member_id?: string | null;
    shared_expense_split_id?: string | null;
    shared_expenses?: { title: string } | null;
  };

  if (settlementRow.status !== "pending") {
    throw new Error("Questo rimborso e gia stato gestito.");
  }

  if (
    actorUserId !== settlementRow.payer_user_id &&
    actorUserId !== settlementRow.payee_user_id
  ) {
    throw new Error("Solo uno degli utenti coinvolti puo accettare il rimborso.");
  }

  const settlementUpdate: SettlementUpdate = {
    status: "completed",
    accepted_by_user_id: actorUserId,
    accepted_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from("settlements")
    .update(settlementUpdate as never)
    .eq("id", settlementId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const splitId = settlementRow.shared_expense_split_id ?? null;
  if (!splitId) {
    throw new Error("Il rimborso non e collegato a una quota valida.");
  }

  await applySettlementToSplit(splitId, settlementRow.amount);
  await syncSettlementTransactions({
    settlementId: settlementRow.id,
    groupId: settlementRow.group_id,
    amount: settlementRow.amount,
    settlementDate: settlementRow.settlement_date,
    title: settlementRow.shared_expenses?.title ?? "Spesa condivisa",
    note: settlementRow.note,
    payerUserId: settlementRow.payer_user_id,
    payeeUserId: settlementRow.payee_user_id
  });
}
