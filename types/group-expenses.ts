export type GroupRole = "owner" | "admin" | "member";
export type SplitMethod = "equal" | "custom";
export type GroupMemberType = "app_user" | "guest";

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string | null;
  displayName: string;
  email: string | null;
  avatarUrl: string | null;
  guestEmail: string | null;
  isGuest: boolean;
  role: GroupRole;
  joinedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  currency: string;
  members: GroupMember[];
  createdAt: string;
};

export type UserInviteCandidate = {
  id: string;
  email: string;
  fullName: string | null;
};

export type SharedExpenseSplit = {
  id: string;
  expenseId: string;
  groupMemberId: string;
  amount: number;
  settledAmount: number;
  isPaid: boolean;
  member?: GroupMember;
};

export type SharedExpense = {
  id: string;
  groupId: string;
  title: string;
  description: string;
  amount: number;
  expenseDate: string;
  splitMethod: SplitMethod;
  paidByMemberId: string;
  paidByMember?: GroupMember;
  splits: SharedExpenseSplit[];
};

export type Settlement = {
  id: string;
  groupId: string;
  sharedExpenseId: string | null;
  sharedExpenseSplitId: string | null;
  payerMemberId: string;
  payeeMemberId: string;
  payerUserId: string | null;
  payeeUserId: string | null;
  amount: number;
  settlementDate: string;
  status: "pending" | "completed" | "cancelled";
  createdByUserId: string;
  acceptedByUserId: string | null;
  acceptedAt: string | null;
  note: string;
};

export type GroupBalance = {
  memberId: string;
  displayName: string;
  netBalance: number;
};

export type DebtEdge = {
  fromMemberId: string;
  fromDisplayName: string;
  toMemberId: string;
  toDisplayName: string;
  amount: number;
};

export type GroupBalanceSummary = {
  balances: GroupBalance[];
  debts: DebtEdge[];
};

export type GroupDetails = {
  group: Group;
  expenses: SharedExpense[];
  settlements: Settlement[];
  summary: GroupBalanceSummary;
};

export type CreateGroupFormValues = {
  name: string;
  description: string;
};

export type AddGroupMemberFormValues = {
  groupId: string;
  email: string;
  displayName: string;
  guestEmail: string;
  memberType: GroupMemberType;
};

export type CreateSharedExpenseFormValues = {
  groupId: string;
  title: string;
  description: string;
  amount: string;
  expenseDate: string;
  splitMethod: SplitMethod;
  paidByMemberId: string;
  splitValues: string;
};

export type SettleSplitFormValues = {
  groupId: string;
  expenseId: string;
  splitId: string;
  payerMemberId: string;
  payeeMemberId: string;
  amount: string;
  note: string;
};

export type GroupFormState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};
