"use client";

import { useMemo, useState } from "react";
import {
  Bell,
  GitBranch,
  Loader2,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Timer,
  UserCog,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { useToast } from "@/components/providers/toast-provider";
import { apiFetch, getApiErrorMessage } from "@/lib/api/client";
import type { ConfigurationDashboardData, ConfigurationMutationInput } from "@/lib/configuration/engine";

const eventTypes = ["approval.pending", "approval.escalated", "report.ready"] as const;
const channels = ["IN_APP", "EMAIL", "SLACK"] as const;

export function SettingsDashboard({ data }: { data: ConfigurationDashboardData }) {
  const firstWorkflowId = data.workflows[0]?.id ?? "";
  const firstPermissionKeys = data.availablePermissions.slice(0, 8).map((permission) => permission.key);
  const [organizationForm, setOrganizationForm] = useState({
    timezone: data.organization.timezone,
    locale: data.organization.locale,
    currency: data.organization.currency,
    fiscalYearStartMonth: data.organization.fiscalYearStartMonth,
    requireMfaForFinanceApproval: Boolean(data.organization.settings.requireMfaForFinanceApproval ?? true),
    customFieldsEnabled: Boolean(data.organization.settings.customFieldsEnabled ?? true),
  });
  const [workflowForm, setWorkflowForm] = useState({
    workflowId: firstWorkflowId,
    name: "Runtime approval routing",
    routingMode: "amount_and_risk",
    amountThreshold: 500000,
  });
  const [approvalForm, setApprovalForm] = useState({
    name: "Configurable approval chain",
    workflowId: firstWorkflowId,
    approvalType: "SEQUENTIAL" as const,
    steps: "Finance validation:finance-manager\nCFO approval:cfo",
  });
  const [roleForm, setRoleForm] = useState({
    name: "Regional Finance Lead",
    permissionKeys: firstPermissionKeys,
  });
  const [financeRuleForm, setFinanceRuleForm] = useState({
    name: "High value approval rule",
    thresholdAmount: 750000,
    ruleType: "approval_threshold",
  });
  const [customFieldForm, setCustomFieldForm] = useState({
    entityType: "invoice",
    fieldKey: "business_unit",
    label: "Business unit",
    fieldType: "text" as const,
    required: true,
  });
  const [slaForm, setSlaForm] = useState({
    workflowId: firstWorkflowId,
    entityType: "approval",
    priority: "high",
    targetMinutes: 480,
    escalationMinutes: 360,
  });
  const [notificationState, setNotificationState] = useState(
    () =>
      new Set(
        data.notificationPreferences
          .filter((preference) => preference.enabled)
          .map((preference) => `${preference.channel}:${preference.eventType}`),
      ),
  );
  const [loading, setLoading] = useState<string | null>(null);
  const { showToast } = useToast();

  const selectedWorkflowName = useMemo(
    () => data.workflows.find((workflow) => workflow.id === workflowForm.workflowId)?.name ?? "Workflow",
    [data.workflows, workflowForm.workflowId],
  );

  async function save(key: string, payload: ConfigurationMutationInput) {
    setLoading(key);
    const result = await apiFetch<unknown>("/api/settings/configuration", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    setLoading(null);

    if (!result.success) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to save configuration."),
      });
      return;
    }

    showToast({ variant: "success", message: "Configuration saved." });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Admin settings</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Enterprise configuration
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Tenant configuration for {data.organization.name}
          </p>
        </div>
        <Badge variant="info">{data.organization.slug}</Badge>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Workflows"
          value={String(data.summary.configurableWorkflows)}
          change={`${data.summary.slaPolicies} SLA policies`}
          trend="neutral"
          icon={GitBranch}
        />
        <StatCard
          label="Approval chains"
          value={String(data.summary.approvalChains)}
          change={`${data.summary.financeRules} finance rules`}
          trend="neutral"
          icon={ShieldCheck}
        />
        <StatCard
          label="Custom roles"
          value={String(data.summary.customRoles)}
          change={`${data.roles.length} total roles`}
          trend="neutral"
          icon={UserCog}
        />
        <StatCard
          label="Custom fields"
          value={String(data.summary.customFields)}
          change={`${data.summary.storedConfigurations} config records`}
          trend="neutral"
          icon={SlidersHorizontal}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SettingsCard
          title="Organization settings"
          description={`${data.organization.locale} | ${data.organization.currency}`}
          icon={Settings}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("organization", {
                  section: "organization",
                  data: {
                    timezone: organizationForm.timezone,
                    locale: organizationForm.locale,
                    currency: organizationForm.currency,
                    fiscalYearStartMonth: Number(organizationForm.fiscalYearStartMonth),
                    settings: {
                      requireMfaForFinanceApproval: organizationForm.requireMfaForFinanceApproval,
                      customFieldsEnabled: organizationForm.customFieldsEnabled,
                    },
                  },
                })
              }
              disabled={loading !== null}
            >
              {loading === "organization" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Timezone"
              value={organizationForm.timezone}
              onChange={(value) => setOrganizationForm((current) => ({ ...current, timezone: value }))}
            />
            <TextField
              label="Locale"
              value={organizationForm.locale}
              onChange={(value) => setOrganizationForm((current) => ({ ...current, locale: value }))}
            />
            <TextField
              label="Currency"
              value={organizationForm.currency}
              onChange={(value) => setOrganizationForm((current) => ({ ...current, currency: value.toUpperCase().slice(0, 3) }))}
            />
            <NumberField
              label="Fiscal start"
              value={organizationForm.fiscalYearStartMonth}
              onChange={(value) => setOrganizationForm((current) => ({ ...current, fiscalYearStartMonth: value }))}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <CheckboxField
              label="MFA for finance approvals"
              checked={organizationForm.requireMfaForFinanceApproval}
              onChange={(checked) => setOrganizationForm((current) => ({ ...current, requireMfaForFinanceApproval: checked }))}
            />
            <CheckboxField
              label="Custom fields"
              checked={organizationForm.customFieldsEnabled}
              onChange={(checked) => setOrganizationForm((current) => ({ ...current, customFieldsEnabled: checked }))}
            />
          </div>
        </SettingsCard>

        <SettingsCard
          title="Workflow configuration"
          description={selectedWorkflowName}
          icon={GitBranch}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("workflow", {
                  section: "workflow",
                  data: {
                    workflowId: workflowForm.workflowId,
                    name: workflowForm.name,
                    activate: true,
                    config: {
                      routingMode: workflowForm.routingMode,
                      amountThreshold: Number(workflowForm.amountThreshold),
                      controls: {
                        budgetCheck: true,
                        duplicateCheck: true,
                      },
                    },
                  },
                })
              }
              disabled={loading !== null || !workflowForm.workflowId}
            >
              {loading === "workflow" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Publish
            </Button>
          }
        >
          <SelectField
            label="Workflow"
            value={workflowForm.workflowId}
            options={data.workflows.map((workflow) => ({ label: workflow.name, value: workflow.id }))}
            onChange={(value) => setWorkflowForm((current) => ({ ...current, workflowId: value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Config name"
              value={workflowForm.name}
              onChange={(value) => setWorkflowForm((current) => ({ ...current, name: value }))}
            />
            <TextField
              label="Routing mode"
              value={workflowForm.routingMode}
              onChange={(value) => setWorkflowForm((current) => ({ ...current, routingMode: value }))}
            />
            <NumberField
              label="Amount threshold"
              value={workflowForm.amountThreshold}
              onChange={(value) => setWorkflowForm((current) => ({ ...current, amountThreshold: value }))}
            />
          </div>
          <ListPreview
            empty="No workflow configurations."
            items={data.workflows.slice(0, 4).map((workflow) => ({
              id: workflow.id,
              label: workflow.name,
              detail: workflow.activeConfigurationName
                ? `v${workflow.activeConfigurationVersion} | ${workflow.activeConfigurationName}`
                : "Default definition",
            }))}
          />
        </SettingsCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SettingsCard
          title="Approval chain builder"
          description={`${data.summary.approvalChains} active chain(s)`}
          icon={ShieldCheck}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("approval", {
                  section: "approvalChain",
                  data: {
                    name: approvalForm.name,
                    workflowId: approvalForm.workflowId || undefined,
                    approvalType: approvalForm.approvalType,
                    steps: parseApprovalSteps(approvalForm.steps),
                  },
                })
              }
              disabled={loading !== null}
            >
              {loading === "approval" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        >
          <TextField
            label="Chain name"
            value={approvalForm.name}
            onChange={(value) => setApprovalForm((current) => ({ ...current, name: value }))}
          />
          <SelectField
            label="Workflow"
            value={approvalForm.workflowId}
            options={data.workflows.map((workflow) => ({ label: workflow.name, value: workflow.id }))}
            onChange={(value) => setApprovalForm((current) => ({ ...current, workflowId: value }))}
          />
          <TextAreaField
            label="Steps"
            value={approvalForm.steps}
            onChange={(value) => setApprovalForm((current) => ({ ...current, steps: value }))}
          />
          <ListPreview
            empty="No approval chains."
            items={data.approvalChains.slice(0, 4).map((chain) => ({
              id: chain.id,
              label: chain.name,
              detail: `${chain.stepCount} step(s) | ${chain.approvalType}`,
            }))}
          />
        </SettingsCard>

        <SettingsCard
          title="Custom role management"
          description={`${data.roles.length} role(s) configured`}
          icon={UserCog}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("role", {
                  section: "role",
                  data: {
                    name: roleForm.name,
                    permissionKeys: roleForm.permissionKeys,
                    description: "Tenant-defined configuration role",
                  },
                })
              }
              disabled={loading !== null || roleForm.permissionKeys.length === 0}
            >
              {loading === "role" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        >
          <TextField
            label="Role name"
            value={roleForm.name}
            onChange={(value) => setRoleForm((current) => ({ ...current, name: value }))}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            {data.availablePermissions.slice(0, 10).map((permission) => (
              <CheckboxField
                key={permission.key}
                label={permission.key}
                checked={roleForm.permissionKeys.includes(permission.key)}
                onChange={(checked) =>
                  setRoleForm((current) => ({
                    ...current,
                    permissionKeys: checked
                      ? [...new Set([...current.permissionKeys, permission.key])]
                      : current.permissionKeys.filter((key) => key !== permission.key),
                  }))
                }
              />
            ))}
          </div>
          <ListPreview
            empty="No custom roles."
            items={data.roles.filter((role) => !role.isSystem).slice(0, 4).map((role) => ({
              id: role.id,
              label: role.name,
              detail: `${role.permissionCount} permission(s)`,
            }))}
          />
        </SettingsCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <SettingsCard
          title="Notification preferences"
          description={`${data.summary.notificationPreferences} saved preference(s)`}
          icon={Bell}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("notifications", {
                  section: "notifications",
                  data: {
                    preferences: eventTypes.flatMap((eventType) =>
                      channels.map((channel) => ({
                        channel,
                        eventType,
                        enabled: notificationState.has(`${channel}:${eventType}`),
                      })),
                    ),
                  },
                })
              }
              disabled={loading !== null}
            >
              {loading === "notifications" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        >
          <div className="space-y-2">
            {eventTypes.map((eventType) => (
              <div key={eventType} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{formatLabel(eventType)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {channels.map((channel) => (
                    <CheckboxField
                      key={`${channel}:${eventType}`}
                      label={channel}
                      checked={notificationState.has(`${channel}:${eventType}`)}
                      onChange={(checked) =>
                        setNotificationState((current) => {
                          const next = new Set(current);
                          const key = `${channel}:${eventType}`;
                          if (checked) next.add(key);
                          else next.delete(key);
                          return next;
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard
          title="Finance rule configuration"
          description={`${data.summary.financeRules} rule(s)`}
          icon={WalletCards}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("finance", {
                  section: "financeRule",
                  data: {
                    name: financeRuleForm.name,
                    ruleType: financeRuleForm.ruleType,
                    thresholdAmount: Number(financeRuleForm.thresholdAmount),
                    conditions: { amountGte: Number(financeRuleForm.thresholdAmount), entityType: "payment" },
                    actions: { requireApprovalRole: "cfo", requireBudgetCheck: true },
                    priority: 15,
                    isActive: true,
                  },
                })
              }
              disabled={loading !== null}
            >
              {loading === "finance" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        >
          <TextField
            label="Rule name"
            value={financeRuleForm.name}
            onChange={(value) => setFinanceRuleForm((current) => ({ ...current, name: value }))}
          />
          <TextField
            label="Rule type"
            value={financeRuleForm.ruleType}
            onChange={(value) => setFinanceRuleForm((current) => ({ ...current, ruleType: value }))}
          />
          <NumberField
            label="Threshold"
            value={financeRuleForm.thresholdAmount}
            onChange={(value) => setFinanceRuleForm((current) => ({ ...current, thresholdAmount: value }))}
          />
          <ListPreview
            empty="No finance rules."
            items={data.financeRules.slice(0, 4).map((rule) => ({
              id: rule.id,
              label: rule.name,
              detail: `${rule.ruleType} | priority ${rule.priority}`,
            }))}
          />
        </SettingsCard>

        <SettingsCard
          title="Workflow SLA configuration"
          description={`${data.summary.slaPolicies} policy record(s)`}
          icon={Timer}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("sla", {
                  section: "sla",
                  data: {
                    workflowId: slaForm.workflowId || undefined,
                    entityType: slaForm.entityType,
                    priority: slaForm.priority,
                    targetMinutes: Number(slaForm.targetMinutes),
                    escalationMinutes: Number(slaForm.escalationMinutes),
                    breachActions: { sendReminder: true, escalateToRole: "organization-admin" },
                    isActive: true,
                  },
                })
              }
              disabled={loading !== null}
            >
              {loading === "sla" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        >
          <SelectField
            label="Workflow"
            value={slaForm.workflowId}
            options={data.workflows.map((workflow) => ({ label: workflow.name, value: workflow.id }))}
            onChange={(value) => setSlaForm((current) => ({ ...current, workflowId: value }))}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField
              label="Target mins"
              value={slaForm.targetMinutes}
              onChange={(value) => setSlaForm((current) => ({ ...current, targetMinutes: value }))}
            />
            <NumberField
              label="Escalate mins"
              value={slaForm.escalationMinutes}
              onChange={(value) => setSlaForm((current) => ({ ...current, escalationMinutes: value }))}
            />
          </div>
          <ListPreview
            empty="No SLA policies."
            items={data.slaPolicies.slice(0, 4).map((policy) => ({
              id: policy.id,
              label: policy.workflowName,
              detail: `${policy.targetMinutes}m target | ${policy.escalationMinutes}m escalation`,
            }))}
          />
        </SettingsCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SettingsCard
          title="Custom field support"
          description={`${data.summary.customFields} field definition(s)`}
          icon={SlidersHorizontal}
          action={
            <Button
              size="sm"
              onClick={() =>
                save("customField", {
                  section: "customField",
                  data: {
                    entityType: customFieldForm.entityType,
                    fieldKey: customFieldForm.fieldKey,
                    label: customFieldForm.label,
                    fieldType: customFieldForm.fieldType,
                    required: customFieldForm.required,
                    displayOrder: 50,
                    isActive: true,
                  },
                })
              }
              disabled={loading !== null}
            >
              {loading === "customField" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Entity"
              value={customFieldForm.entityType}
              onChange={(value) => setCustomFieldForm((current) => ({ ...current, entityType: value }))}
            />
            <TextField
              label="Field key"
              value={customFieldForm.fieldKey}
              onChange={(value) => setCustomFieldForm((current) => ({ ...current, fieldKey: value }))}
            />
            <TextField
              label="Label"
              value={customFieldForm.label}
              onChange={(value) => setCustomFieldForm((current) => ({ ...current, label: value }))}
            />
            <SelectField
              label="Type"
              value={customFieldForm.fieldType}
              options={["text", "number", "date", "select", "boolean", "currency", "json"].map((type) => ({
                label: formatLabel(type),
                value: type,
              }))}
              onChange={(value) => setCustomFieldForm((current) => ({ ...current, fieldType: value as typeof customFieldForm.fieldType }))}
            />
          </div>
          <CheckboxField
            label="Required"
            checked={customFieldForm.required}
            onChange={(checked) => setCustomFieldForm((current) => ({ ...current, required: checked }))}
          />
          <ListPreview
            empty="No custom fields."
            items={data.customFields.slice(0, 5).map((field) => ({
              id: field.id,
              label: `${field.entityType}.${field.fieldKey}`,
              detail: `${field.label} | ${field.fieldType}`,
            }))}
          />
        </SettingsCard>

        <SettingsCard
          title="Tenant configuration storage"
          description={`${data.summary.storedConfigurations} stored record(s)`}
          icon={Settings}
        >
          <ListPreview
            empty="No stored configurations."
            items={data.storedConfigurations.slice(0, 10).map((config) => ({
              id: config.id,
              label: `${config.category}.${config.configKey}`,
              detail: `v${config.version} | ${formatDate(config.updatedAt)}`,
            }))}
          />
        </SettingsCard>
      </section>

    </div>
  );
}

function SettingsCard({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-primary"
      />
      {label}
    </label>
  );
}

function ListPreview({
  empty,
  items,
}: {
  empty: string;
  items: Array<{ id: string; label: string; detail: string }>;
}) {
  if (items.length === 0) {
    return <EmptyState title={empty} description="Seed demo data or add a configuration record from this panel." />;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
          <div className="min-w-0">
            <p className="line-clamp-1 text-sm font-medium">{item.label}</p>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function parseApprovalSteps(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [label, assigneeRole] = line.split(":");
      return {
        label: label?.trim() || `Step ${index + 1}`,
        assigneeRole: assigneeRole?.trim() || "organization-admin",
        sequence: index + 1,
        required: true,
      };
    });
}

function formatLabel(value: string): string {
  return value
    .replace(/[._-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(iso));
}
