import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/auth/login-screen";
import { DASHBOARD_ACCESS_ROLES, getServerAuth } from "@/lib/auth/server";
import { hasAnyRole } from "@/lib/auth/rbac";

export const metadata: Metadata = {
  title: "Sign In | ASTRA",
  description: "Secure enterprise sign in for ASTRA.",
};

export default async function LoginPage() {
  const auth = await getServerAuth();

  if (
    auth &&
    (auth.isSuperAdmin || hasAnyRole(auth.roles, [...DASHBOARD_ACCESS_ROLES]))
  ) {
    redirect("/dashboard");
  }

  return <LoginScreen />;
}
