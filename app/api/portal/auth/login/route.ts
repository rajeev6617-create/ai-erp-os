import { NextResponse, type NextRequest } from "next/server";
import type { PortalAccountType } from "@/app/generated/prisma/client";
import { getRequestMeta } from "@/lib/api/request-meta";
import { loginPortalAccount, setPortalSessionCookie } from "@/lib/relationships/portal-auth";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const accountType = String(formData.get("accountType") ?? "") as PortalAccountType;
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const loginPath = accountType === "VENDOR" ? "/portal/vendor/login" : "/portal/customer/login";

  if (!["CUSTOMER", "VENDOR"].includes(accountType)) {
    return NextResponse.redirect(new URL("/portal/customer/login?error=invalid", request.url), {
      status: 303,
    });
  }

  try {
    const meta = await getRequestMeta();
    const result = await loginPortalAccount({
      accountType,
      email,
      password,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
    const destination = result.accountType === "VENDOR" ? "/portal/vendor" : "/portal/customer";
    const response = NextResponse.redirect(new URL(destination, request.url), {
      status: 303,
    });
    setPortalSessionCookie(response, result.token);
    return response;
  } catch {
    return NextResponse.redirect(new URL(`${loginPath}?error=invalid`, request.url), {
      status: 303,
    });
  }
}
