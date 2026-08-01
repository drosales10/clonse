"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/server/auth/session";
import { resetOwnProfileViews } from "@/server/profile-views/service";

export interface ProfileViewsResetFormState {
  message?: string;
  success?: boolean;
}

export async function resetProfileViewsAction(
  _previousState: ProfileViewsResetFormState,
  _formData: FormData,
): Promise<ProfileViewsResetFormState> {
  void _previousState;
  void _formData;
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnUrl=/home");

  const result = await resetOwnProfileViews(user.id);
  if (!result.ok) redirect("/login?returnUrl=/home");

  revalidatePath("/home");
  revalidatePath(`/profile/${encodeURIComponent(user.username)}`);
  redirect("/home?viewsReset=1");
}
