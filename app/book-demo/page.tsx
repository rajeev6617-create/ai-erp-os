import type { Metadata } from "next";
import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { DemoRequestForm } from "@/components/marketing/demo-request-form";
import { PublicPageShell } from "@/components/marketing/public-shell";

export const metadata: Metadata = {
  title: "Book Demo | AI ERP OS",
  description:
    "Book an AI ERP OS demo for workflow automation, AI approvals, finance intelligence, compliance monitoring, and reporting.",
  keywords: [
    "book AI ERP demo",
    "workflow automation demo",
    "finance intelligence demo",
    "approval automation demo",
    "ERP SaaS demo",
  ],
};

export default function BookDemoPage() {
  return (
    <PublicPageShell>
      <main>
        <section className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-medium text-primary">Book a demo</p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Map your approval, finance, reporting, and automation workflows.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Share your requirements and preferred date. We will tailor the demo around
                your industry, approval controls, GST finance workflows, audit needs, and
                implementation scope.
              </p>
              <div className="mt-8 grid gap-3 text-sm">
                {[
                  ["Implementation-fit discussion", Clock],
                  ["Workflow and finance use-case walkthrough", BadgeCheck],
                  ["Tenant-safe security and audit overview", ShieldCheck],
                ].map(([label, Icon]) => (
                  <div key={label as string} className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-success" />
                    <span>{label as string}</span>
                  </div>
                ))}
              </div>
            </div>
            <DemoRequestForm />
          </div>
        </section>
      </main>
    </PublicPageShell>
  );
}
