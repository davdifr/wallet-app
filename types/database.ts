export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: {
          amount: number;
          category: string | null;
          category_slug: string | null;
          created_at: string;
          currency: string;
          description: string;
          group_id: string | null;
          id: string;
          is_shared: boolean;
          merchant: string | null;
          notes: string | null;
          recurring_income_id: string | null;
          recurring_income_instance_key: string | null;
          recurring_occurrence_date: string | null;
          settlement_id: string | null;
          shared_expense_id: string | null;
          status: "pending" | "cleared" | "cancelled";
          transaction_date: string;
          transaction_type: "income" | "expense" | "transfer";
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category?: string | null;
          category_slug?: string | null;
          currency?: string;
          description: string;
          group_id?: string | null;
          id?: string;
          is_shared?: boolean;
          merchant?: string | null;
          notes?: string | null;
          recurring_income_id?: string | null;
          recurring_income_instance_key?: string | null;
          recurring_occurrence_date?: string | null;
          settlement_id?: string | null;
          shared_expense_id?: string | null;
          status?: "pending" | "cleared" | "cancelled";
          transaction_date: string;
          transaction_type: "income" | "expense" | "transfer";
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string | null;
          category_slug?: string | null;
          currency?: string;
          description?: string;
          group_id?: string | null;
          id?: string;
          is_shared?: boolean;
          merchant?: string | null;
          notes?: string | null;
          recurring_income_id?: string | null;
          recurring_income_instance_key?: string | null;
          recurring_occurrence_date?: string | null;
          settlement_id?: string | null;
          shared_expense_id?: string | null;
          status?: "pending" | "cleared" | "cancelled";
          transaction_date?: string;
          transaction_type?: "income" | "expense" | "transfer";
          user_id?: string;
        };
      };
      recurring_incomes: {
        Row: {
          amount: number;
          category: string | null;
          category_slug: string | null;
          created_at: string;
          currency: string;
          description: string;
          ends_on: string | null;
          frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
          id: string;
          is_active: boolean;
          next_occurrence_on: string;
          source: string;
          starts_on: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          category?: string | null;
          category_slug?: string | null;
          currency?: string;
          description: string;
          ends_on?: string | null;
          frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
          id?: string;
          is_active?: boolean;
          next_occurrence_on: string;
          source: string;
          starts_on: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          category?: string | null;
          category_slug?: string | null;
          currency?: string;
          description?: string;
          ends_on?: string | null;
          frequency?: "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
          id?: string;
          is_active?: boolean;
          next_occurrence_on?: string;
          source?: string;
          starts_on?: string;
          user_id?: string;
        };
      };
      monthly_budget_settings: {
        Row: {
          budget_month: string;
          category_limits: Json;
          created_at: string;
          currency: string;
          id: string;
          notes: string | null;
          rollover_enabled: boolean;
          target_savings: number;
          total_budget: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          budget_month: string;
          category_limits?: Json;
          created_at?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          rollover_enabled?: boolean;
          target_savings?: number;
          total_budget: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          budget_month?: string;
          category_limits?: Json;
          created_at?: string;
          currency?: string;
          id?: string;
          notes?: string | null;
          rollover_enabled?: boolean;
          target_savings?: number;
          total_budget?: number;
          updated_at?: string;
          user_id?: string;
        };
      };
      piggy_bank_settings: {
        Row: {
          auto_monthly_amount: number;
          created_at: string;
          id: string;
          is_auto_enabled: boolean;
          starts_on_month: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          auto_monthly_amount?: number;
          created_at?: string;
          id?: string;
          is_auto_enabled?: boolean;
          starts_on_month: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          auto_monthly_amount?: number;
          created_at?: string;
          id?: string;
          is_auto_enabled?: boolean;
          starts_on_month?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      piggy_bank_movements: {
        Row: {
          amount: number;
          auto_instance_key: string | null;
          created_at: string;
          id: string;
          movement_date: string;
          movement_type: "manual_add" | "manual_release" | "auto_monthly_allocation";
          note: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          auto_instance_key?: string | null;
          created_at?: string;
          id?: string;
          movement_date?: string;
          movement_type: "manual_add" | "manual_release" | "auto_monthly_allocation";
          note?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          auto_instance_key?: string | null;
          created_at?: string;
          id?: string;
          movement_date?: string;
          movement_type?: "manual_add" | "manual_release" | "auto_monthly_allocation";
          note?: string | null;
          updated_at?: string;
          user_id?: string;
        };
      };
      saving_goals: {
        Row: {
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          priority: "low" | "medium" | "high";
          saved_so_far: number;
          status: "active" | "completed" | "cancelled" | "paused";
          target_amount: number;
          target_date: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          currency?: string;
          description?: string | null;
          id?: string;
          priority?: "low" | "medium" | "high";
          saved_so_far?: number;
          status?: "active" | "completed" | "cancelled" | "paused";
          target_amount: number;
          target_date?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          currency?: string;
          description?: string | null;
          id?: string;
          priority?: "low" | "medium" | "high";
          saved_so_far?: number;
          status?: "active" | "completed" | "cancelled" | "paused";
          target_amount?: number;
          target_date?: string | null;
          title?: string;
          user_id?: string;
        };
      };
      goal_contributions: {
        Row: {
          amount: number;
          contribution_date: string;
          created_at: string;
          goal_id: string;
          id: string;
          note: string | null;
          transaction_id: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          contribution_date?: string;
          goal_id: string;
          id?: string;
          note?: string | null;
          transaction_id?: string | null;
          user_id: string;
        };
        Update: {
          amount?: number;
          contribution_date?: string;
          goal_id?: string;
          id?: string;
          note?: string | null;
          transaction_id?: string | null;
          user_id?: string;
        };
      };
      groups: {
        Row: {
          created_at: string;
          currency: string;
          description: string | null;
          id: string;
          name: string;
          owner_user_id: string;
          updated_at: string;
        };
        Insert: {
          currency?: string;
          description?: string | null;
          id?: string;
          name: string;
          owner_user_id: string;
        };
        Update: {
          currency?: string;
          description?: string | null;
          id?: string;
          name?: string;
          owner_user_id?: string;
        };
      };
      group_members: {
        Row: {
          created_at: string;
          display_name: string;
          group_id: string;
          guest_email: string | null;
          id: string;
          is_guest: boolean;
          joined_at: string;
          role: "owner" | "admin" | "member";
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          display_name: string;
          group_id: string;
          guest_email?: string | null;
          id?: string;
          is_guest?: boolean;
          role?: "owner" | "admin" | "member";
          user_id?: string | null;
        };
        Update: {
          display_name?: string;
          guest_email?: string | null;
          group_id?: string;
          id?: string;
          is_guest?: boolean;
          role?: "owner" | "admin" | "member";
          user_id?: string | null;
        };
      };
      group_member_views: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          last_viewed_shared_expenses_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          last_viewed_shared_expenses_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          last_viewed_shared_expenses_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      shared_expenses: {
        Row: {
          amount: number;
          created_at: string;
          created_by_user_id: string;
          currency: string;
          description: string | null;
          expense_date: string;
          group_id: string;
          id: string;
          paid_by_member_id: string | null;
          paid_by_user_id: string | null;
          split_method: "equal" | "custom" | "percentage" | "shares";
          status: "draft" | "posted" | "settled" | "cancelled";
          title: string;
          transaction_id: string | null;
          updated_at: string;
        };
        Insert: {
          amount: number;
          created_by_user_id: string;
          currency?: string;
          description?: string | null;
          expense_date: string;
          group_id: string;
          id?: string;
          paid_by_member_id?: string | null;
          paid_by_user_id?: string | null;
          split_method?: "equal" | "custom" | "percentage" | "shares";
          status?: "draft" | "posted" | "settled" | "cancelled";
          title: string;
          transaction_id?: string | null;
        };
        Update: {
          amount?: number;
          created_by_user_id?: string;
          currency?: string;
          description?: string | null;
          expense_date?: string;
          group_id?: string;
          id?: string;
          paid_by_member_id?: string | null;
          paid_by_user_id?: string | null;
          split_method?: "equal" | "custom" | "percentage" | "shares";
          status?: "draft" | "posted" | "settled" | "cancelled";
          title?: string;
          transaction_id?: string | null;
        };
      };
      shared_expense_splits: {
        Row: {
          amount: number;
          created_at: string;
          group_member_id: string | null;
          id: string;
          is_paid: boolean;
          percentage: number | null;
          settled_amount: number;
          settled_at: string | null;
          shared_expense_id: string;
          shares: number | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          amount: number;
          group_member_id?: string | null;
          id?: string;
          is_paid?: boolean;
          percentage?: number | null;
          settled_amount?: number;
          settled_at?: string | null;
          shared_expense_id: string;
          shares?: number | null;
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          group_member_id?: string | null;
          id?: string;
          is_paid?: boolean;
          percentage?: number | null;
          settled_amount?: number;
          settled_at?: string | null;
          shared_expense_id?: string;
          shares?: number | null;
          user_id?: string | null;
        };
      };
      settlements: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          group_id: string;
          id: string;
          note: string | null;
          accepted_at: string | null;
          accepted_by_user_id: string | null;
          created_by_user_id: string;
          payee_member_id: string | null;
          payee_user_id: string | null;
          payer_member_id: string | null;
          payer_user_id: string | null;
          settlement_date: string;
          shared_expense_id: string | null;
          shared_expense_split_id: string | null;
          status: "pending" | "completed" | "cancelled";
          updated_at: string;
        };
        Insert: {
          amount: number;
          currency?: string;
          group_id: string;
          id?: string;
          note?: string | null;
          accepted_at?: string | null;
          accepted_by_user_id?: string | null;
          created_by_user_id: string;
          payee_member_id?: string | null;
          payee_user_id?: string | null;
          payer_member_id?: string | null;
          payer_user_id?: string | null;
          settlement_date: string;
          shared_expense_id?: string | null;
          shared_expense_split_id?: string | null;
          status?: "pending" | "completed" | "cancelled";
        };
        Update: {
          amount?: number;
          currency?: string;
          group_id?: string;
          id?: string;
          note?: string | null;
          accepted_at?: string | null;
          accepted_by_user_id?: string | null;
          created_by_user_id?: string;
          payee_member_id?: string | null;
          payee_user_id?: string | null;
          payer_member_id?: string | null;
          payer_user_id?: string | null;
          settlement_date?: string;
          shared_expense_id?: string | null;
          shared_expense_split_id?: string | null;
          status?: "pending" | "completed" | "cancelled";
        };
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          default_currency: string;
          email: string;
          full_name: string | null;
          id: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          default_currency?: string;
          email: string;
          full_name?: string | null;
          id: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          default_currency?: string;
          email?: string;
          full_name?: string | null;
          timezone?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      goal_priority: "low" | "medium" | "high";
      goal_status: "active" | "completed" | "cancelled" | "paused";
      group_role: "owner" | "admin" | "member";
      piggy_bank_movement_type:
        | "manual_add"
        | "manual_release"
        | "auto_monthly_allocation";
      settlement_status: "pending" | "completed" | "cancelled";
      shared_expense_status: "draft" | "posted" | "settled" | "cancelled";
      split_method: "equal" | "custom" | "percentage" | "shares";
      transaction_status: "pending" | "cleared" | "cancelled";
      transaction_type: "income" | "expense" | "transfer";
    };
    CompositeTypes: Record<string, never>;
  };
};
