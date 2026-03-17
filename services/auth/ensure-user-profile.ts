import type { User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type UserProfileInsert = Database["public"]["Tables"]["users"]["Insert"];

export async function ensureUserProfile(user: User) {
  const supabase = await createSupabaseServerClient();

  const payload: UserProfileInsert = {
    id: user.id,
    email: user.email ?? "",
    full_name:
      user.user_metadata.full_name ??
      user.user_metadata.name ??
      null,
    avatar_url: user.user_metadata.avatar_url ?? null,
    default_currency: "EUR",
    timezone: "UTC"
  };

  const { error } = await supabase
    .from("users")
    .upsert(payload as never, {
      onConflict: "id"
    });

  if (error) {
    throw new Error(error.message);
  }
}
