"use server";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/server/auth/session";
import { markAllNotificationsRead } from "@/server/notifications/service";

export async function markAllNotificationsReadAction(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/account/notifications");

  await markAllNotificationsRead(user.id);
  redirect("/account/notifications?read=1");
}
