import { NextResponse } from "next/server";

import {
  currentPasswordFromFormData,
  passwordPairFromFormData,
  validatePasswordPair,
} from "@domain/access";
import { getCurrentSessionToken, getCurrentUser } from "@/server/auth/session";
import { changeUserPassword } from "@/server/auth/store";

export async function POST(request: Request): Promise<Response> {
  const user = await getCurrentUser();
  const returnUrl = new URL("/account/profile", request.url);
  if (!user) {
    return NextResponse.redirect(new URL("/login?returnUrl=/account/profile", request.url), 303);
  }

  const formData = await request.formData();
  const currentPassword = currentPasswordFromFormData(formData);
  const passwords = passwordPairFromFormData(formData);
  if (!currentPassword || !validatePasswordPair(passwords.password, passwords.passwordConfirmation).success) {
    returnUrl.searchParams.set("security", "password-invalid");
    return NextResponse.redirect(returnUrl, 303);
  }
  const validation = validatePasswordPair(passwords.password, passwords.passwordConfirmation);
  if (!validation.success) {
    returnUrl.searchParams.set("security", "password-invalid");
    return NextResponse.redirect(returnUrl, 303);
  }

  const result = await changeUserPassword(user.id, currentPassword, validation.data.password, await getCurrentSessionToken());
  returnUrl.searchParams.set("security", result.ok ? "password-updated" : "password-error");
  return NextResponse.redirect(returnUrl, 303);
}
