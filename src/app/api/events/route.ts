import { NextRequest } from "next/server";

import { normalizeEventQuery, type EventSort, type EventView } from "@domain/events";
import { getCurrentUser } from "@/server/auth/session";
import { getEventCatalog } from "@/server/events/service";

export async function GET(request: NextRequest): Promise<Response> {
  const url = request.nextUrl;
  const rawPage = Number(url.searchParams.get("page"));
  const query = normalizeEventQuery({
    page: Number.isInteger(rawPage) ? rawPage : 1,
    categoryId: url.searchParams.get("categoryId"),
    sort: parseSort(url.searchParams.get("sort")),
    view: parseView(url.searchParams.get("view")),
  });
  const viewer = await getCurrentUser();
  const result = await getEventCatalog(viewer?.id ?? null, query);
  return Response.json(result);
}

function parseSort(value: string | null): EventSort | undefined {
  return value === "created" || value === "startsAt" || value === "endsAt" ? value : undefined;
}

function parseView(value: string | null): EventView | undefined {
  return value === "upcoming" || value === "all" ? value : undefined;
}
