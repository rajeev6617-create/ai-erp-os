import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { PublicPageShell } from "@/components/marketing/public-shell";

export const metadata: Metadata = {
  title: "Pricing | ASTRA",
  description:
    "Simple ASTRA pricing for workflow automation, finance intelligence, approval controls, reporting, and enterprise customization.",
  keywords: [
    "ASTRA pricing",
    "workflow automation pricing",
    "finance automation pricing",
    "ERP implementation pilot",
    "enterprise SaaS pricing",
  ],
};

const plans = [
  {
    name: "Starter",
    price: "Pilot",
    description: "For teams starting with approval automation and MIS reporting.",
    features: [
      "Workflow approval dashboard",
      "Basic finance KPIs",
      "Excel MIS exports",
      "Email reminder placeholders",
      "Single demo tenant setup",
    ],
    cta: "Start Pilot",
    highlighted: false,
  },
  {
    name: "Business",
    price: "Custom",
    description: "For growing teams that need finance intelligence and configurable controls.",
    features: [
      "AI workflow intelligence",
      "Vendor, invoice, expense, and payment tracking",
      "Approval chain configuration",
      "Finance rules and SLA policies",
      "Excel/PDF reporting layer",
    ],
    cta: "Book Demo",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Contact",
    description: "For multi-team deployments with governance, customization, and rollout support.",
    features: [
      "Tenant-safe configuration engine",
      "Custom roles and fields",
      "Advanced audit trail review",
      "Implementation planning",
      "Integration architecture support",
    ],
    cta: "Talk to Sales",
    highlighted: false,
  },
] as const;

export default function PricingPage() {
  return (
    <PublicPageShell>
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <p className="text-sm font-medium text-primary">Pricing</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Flexible plans for pilots, finance teams, and enterprise rollouts.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Start with a focused approval and finance pilot, then expand into configuration,
              reporting, compliance, and automation as your operating model matures.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border bg-card p-6 ${
                  plan.highlighted ? "border-primary shadow-lg shadow-primary/10" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{plan.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                  </div>
                  {plan.highlighted ? (
                    <span className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                      Popular
                    </span>
                  ) : null}
                </div>
                <div className="mt-6">
                  <p className="text-3xl font-bold">{plan.price}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Final pricing depends on scope and rollout.</p>
                </div>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex gap-2 text-sm">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/book-demo"
                  className={`mt-8 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "border border-border bg-background hover:bg-muted"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["Setup fee", "A one-time setup fee may apply for tenant setup, seed data, configuration, and workflow mapping."],
              ["Customization", "Custom workflows, fields, roles, finance rules, reports, and integration architecture are scoped separately."],
              ["Pilot option", "A fixed-scope pilot can validate approval workflows, finance MIS, audit trails, and automation before full rollout."],
            ].map(([title, text]) => (
              <div key={title} className="rounded-lg border border-border bg-card p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
