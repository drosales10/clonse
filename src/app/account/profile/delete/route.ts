import { NextResponse } from "next/server";

import { currentPasswordFromFormData, deleteConfirmationFromFormData, validateDeleteConfirmation } from "@domain/access";
import { destroySession, getCurrentUser } from "@/server/auth/session";
import { deleteUserAccount } from "@/server/auth/store";

export async function POST(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login?returnUrl=/account/profile", request.url), 303);

  const formData = await request.formData();
  const currentPassword = currentPasswordFromFormData(formData);
  const confirmation = validateDeleteConfirmation(deleteConfirmationFromFormData(formData));
  if (!currentPassword || !confirmation.success) {
    return NextResponse.redirect(new URL("/account/profile?security=delete-invalid", request.url), 303);
  }

  const result = await deleteUserAccount(user.id, currentPassword);
  if (!result.ok) return NextResponse.redirect(new URL("/account/profile?security=delete-error", request.url), 303);

  await destroySession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
