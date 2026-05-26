import { NextResponse, type NextRequest } from "next/server";
import { getRequestMeta } from "@/lib/api/request-meta";
import {
  clearPortalSessionCookie,
  PORTAL_SESSION_COOKIE,
  revokePortalSession,
} from "@/lib/relationships/portal-auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(PORTAL_SESSION_COOKIE)?.value ?? null;
  const meta = await getRequestMeta();
  await revokePortalSession({
    token,
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  const response = NextResponse.redirect(new URL("/portal/customer/login", request.url), {
    status: 303,
  });
  clearPortalSessionCookie(response);
  return response;
}
