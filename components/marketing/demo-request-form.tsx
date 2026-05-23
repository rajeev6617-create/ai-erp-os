"use client";

import { useState } from "react";
import { CalendarCheck, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const industries = [
  "Manufacturing",
  "CA Firms",
  "Trading Businesses",
  "Finance Teams",
  "SMEs",
  "Other",
] as const;

export function DemoRequestForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      event.currentTarget.reset();
    }, 500);
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" autoComplete="name" required />
        <Field label="Company" name="company" autoComplete="organization" required />
        <Field label="Phone" name="phone" type="tel" autoComplete="tel" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <label className="grid gap-1.5 text-sm font-medium">
          Industry
          <select
            name="industry"
            required
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </label>
        <Field label="Preferred demo date" name="preferredDemoDate" type="date" required />
      </div>
      <label className="mt-4 grid gap-1.5 text-sm font-medium">
        Requirement
        <textarea
          name="requirement"
          required
          rows={5}
          placeholder="Tell us about your approval, finance, reporting, or automation requirements."
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </label>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <CalendarCheck className="h-4 w-4 text-success" />
          Demo requests are reviewed by the implementation team.
        </p>
        <Button type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Submit
        </Button>
      </div>
      {submitted ? (
        <div className="mt-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Demo request captured. The team can wire this form to CRM or email when a provider is configured.
        </div>
      ) : null}
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}
