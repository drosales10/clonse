import { NextResponse } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { markAllNotificationsRead } from "@/server/notifications/service";

export async function POST(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login?returnUrl=/account/notifications", request.url), 303);
  }

  await markAllNotificationsRead(user.id);
  return NextResponse.redirect(new URL("/account/notifications?read=1", request.url), 303);
}
