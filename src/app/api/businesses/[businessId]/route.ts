import { NextRequest } from "next/server";

import { getCurrentUser } from "@/server/auth/session";
import { getBusinessDetail } from "@/server/businesses/service";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ businessId: string }> }): Promise<Response> {
  const { businessId } = await params;
  const viewer = await getCurrentUser();
  const business = await getBusinessDetail(viewer?.id ?? null, businessId);
  return business ? Response.json(business) : Response.json({ code: "BUSINESS_NOT_FOUND" }, { status: 404 });
}
