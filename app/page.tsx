import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bot,
  Building2,
  ClipboardCheck,
  FileSpreadsheet,
  GitBranch,
  MailCheck,
  Play,
  ShieldCheck,
  Siren,
} from "lucide-react";
import { PublicPageShell } from "@/components/marketing/public-shell";
import { ProductPreview } from "@/components/marketing/product-preview";

export const metadata: Metadata = {
  title: "ASTRA | The AI Operating System for Modern Enterprises",
  description:
    "ASTRA is the AI operating system for modern enterprises, unifying approvals, audit trails, finance intelligence, compliance monitoring, and reporting.",
  keywords: [
    "ASTRA",
    "AI operating system",
    "workflow automation",
    "finance automation",
    "AI approvals",
    "audit trail",
    "GST finance software",
    "ERP for SMEs",
    "WhatsApp automation",
  ],
};

const features = [
  {
    title: "Workflow automation",
    description: "Route approvals, reminders, escalations, and evidence capture through configurable workflows.",
    icon: GitBranch,
  },
  {
    title: "AI approvals",
    description: "Prioritize pending decisions with risk, SLA, confidence, and recommendation signals.",
    icon: Bot,
  },
  {
    title: "Audit trail",
    description: "Capture every approval, reminder, report export, and configuration change in tenant audit logs.",
    icon: ClipboardCheck,
  },
  {
    title: "Finance intelligence",
    description: "Track invoices, vendors, GST liability, budgets, expenses, and outstanding payments.",
    icon: BarChart3,
  },
  {
    title: "Compliance monitoring",
    description: "Monitor filing risks, documentation gaps, statutory reminders, and finance controls.",
    icon: ShieldCheck,
  },
  {
    title: "Excel/PDF reporting",
    description: "Export workflow and finance MIS reports with executive PDF summaries ready for leadership.",
    icon: FileSpreadsheet,
  },
  {
    title: "Email/WhatsApp automation",
    description: "Send approval reminders through email, in-app notifications, and WhatsApp-ready placeholders.",
    icon: MailCheck,
  },
] as const;

const industries = [
  "Manufacturing",
  "CA Firms",
  "Trading Businesses",
  "Finance Teams",
  "SMEs",
] as const;

export default function HomePage() {
  return (
    <PublicPageShell>
      <main>
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 top-16 mx-auto max-w-6xl px-4 opacity-35 blur-[1px] sm:opacity-45">
              <ProductPreview compact />
            </div>
            <div className="absolute inset-0 bg-background/75 dark:bg-background/70" />
          </div>
          <div className="relative mx-auto flex min-h-[86svh] max-w-7xl items-center px-4 py-20 sm:px-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                <BadgeCheck className="h-4 w-4 text-success" />
                Workflow, finance, audit, and compliance in one operating layer
              </div>
              <h1 className="mt-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
                ASTRA
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                The AI operating system for modern enterprises that need approvals,
                GST-ready finance intelligence, audit trails, reporting, and automation without
                stitching together spreadsheets and chat threads.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/book-demo"
                  className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
                >
                  Book Demo
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#demo-preview"
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-5 text-sm font-medium hover:bg-muted"
                >
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">Enterprise workflow intelligence</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Built for operational teams that move money, approvals, and compliance evidence.
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="industries" className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium text-primary">Industry-ready</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Flexible enough for finance-heavy teams and growing businesses.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Configure workflows, approval chains, finance rules, SLA policies, and custom fields
                by tenant without changing the core product.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {industries.map((industry) => (
                <div key={industry} className="flex items-center gap-3 rounded-lg border border-border bg-background p-4">
                  <Building2 className="h-5 w-5 text-success" />
                  <span className="font-medium">{industry}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demo-preview" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="text-sm font-medium text-primary">Demo preview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                See approvals, risk, finance KPIs, and automation status together.
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The product dashboard brings workflow queues, finance intelligence, SLA prediction,
                audit history, notifications, and reporting actions into one operating view.
              </p>
              <div className="mt-6 grid gap-3 text-sm">
                {["Role-aware dashboards", "Finance-linked approvals", "Audit-ready reporting"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <BadgeCheck className="h-4 w-4 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-14 sm:px-6 md:grid-cols-3">
            {[
              ["Tenant isolation", "Organization-scoped data, RBAC, roles, permissions, and audit logs."],
              ["Security controls", "JWT auth, MFA-ready flows, login lockouts, and production env checks."],
              ["Operational audit", "Every approval action, reminder, report, and configuration change can be traced."],
            ].map(([title, description]) => (
              <div key={title} className="rounded-lg border border-border bg-background p-5">
                <Siren className="h-5 w-5 text-warning" />
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Ready to pilot ASTRA with your finance and approval workflows?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Book a guided demo and map your first approval, finance, reporting, and automation flows.
                </p>
              </div>
              <Link
                href="/book-demo"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90"
              >
                Book Demo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
