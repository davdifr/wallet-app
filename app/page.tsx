import { redirect } from "next/navigation";

import { getUser } from "@/services/auth/get-user";

export default async function HomePage() {
  const user = await getUser();

  redirect(user ? "/dashboard" : "/login");
}
