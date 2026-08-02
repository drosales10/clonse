import { db } from "@/server/db/client";

export type AdminContentMutationResult =
  | { ok: true; id?: string }
  | {
      ok: false;
      reason:
        | "not_found"
        | "invalid_owner"
        | "invalid_category"
        | "has_votes"
        | "duplicate"
        | "has_children";
    };

export type AdminCatalogFlags = {
  catalogVisible: boolean;
  searchable: boolean;
};

export async function resolveAdminOwner(username: string) {
  return db.user.findFirst({
    where: { username, enabled: true },
    select: { id: true, username: true, displayName: true },
  });
}

export async function validateActiveCategory(
  categoryId: string | null,
  findCategory: (id: string) => Promise<{ id: string } | null>,
): Promise<boolean> {
  if (!categoryId) return true;
  const category = await findCategory(categoryId);
  return category !== null;
}

export function defaultCatalogFlags(overrides?: Partial<AdminCatalogFlags>): AdminCatalogFlags {
  return {
    catalogVisible: overrides?.catalogVisible ?? true,
    searchable: overrides?.searchable ?? true,
  };
}
