import { redirect } from "next/navigation";
import { getPortalAuth } from "@/lib/relationships/portal-auth";

export default async function VendorPortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const auth = await getPortalAuth("VENDOR");
  if (auth) redirect("/portal/vendor");

  const params = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <p className="text-sm font-medium text-primary">ASTRA secure portal</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Vendor portal</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Secure access for onboarding, support, supplier evidence, and finance collaboration.
        </p>
        {params.error ? (
          <div className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            Unable to sign in with those portal credentials.
          </div>
        ) : null}
        <form action="/api/portal/auth/login" method="post" className="mt-6 space-y-4">
          <input type="hidden" name="accountType" value="VENDOR" />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
