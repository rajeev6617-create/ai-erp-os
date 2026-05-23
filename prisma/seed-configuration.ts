import { Prisma, type PrismaClient } from "../app/generated/prisma/client";

type SeedDb = PrismaClient | Prisma.TransactionClient;

export async function seedConfigurationData(
  prisma: PrismaClient,
  organizationId: string,
  adminUserId: string,
  cfoUserId: string,
  financeManagerUserId: string,
) {
  await prisma.$transaction(
    async (tx) => {
      const workflows = await tx.workflow.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, slug: true, name: true, metadata: true },
      });
      const workflowBySlug = new Map(workflows.map((workflow) => [workflow.slug, workflow]));

      await seedOrganizationSettings(tx, organizationId, adminUserId);
      await seedWorkflowConfigurations(tx, organizationId, adminUserId, workflowBySlug);
      await seedApprovalChains(tx, organizationId, cfoUserId, financeManagerUserId, workflowBySlug);
      await seedCustomRole(tx, organizationId, adminUserId);
      await seedNotificationPreferences(tx, organizationId, adminUserId, cfoUserId, financeManagerUserId);
      await seedFinanceRules(tx, organizationId, adminUserId);
      await seedCustomFields(tx, organizationId, adminUserId);
      await seedSlaPolicies(tx, organizationId, adminUserId, workflowBySlug);
      await seedDemoWalkthrough(tx, organizationId, adminUserId);
    },
    { timeout: 30_000 },
  );

  console.log("  Configuration: seeded settings, rules, custom fields, roles, and SLA policies");
}

async function seedOrganizationSettings(
  tx: SeedDb,
  organizationId: string,
  actorUserId: string,
) {
  const settings = {
    approvalDelegationEnabled: true,
    requireMfaForFinanceApproval: true,
    customFieldsEnabled: true,
    financeApprovalLimitInr: 500_000,
    defaultSlaMinutes: 1_440,
  };

  await tx.organization.update({
    where: { id: organizationId },
    data: {
      timezone: "Asia/Kolkata",
      locale: "en-IN",
      currency: "INR",
      fiscalYearStartMonth: 4,
      settings: asJson(settings),
    },
  });

  await upsertConfig(tx, {
    organizationId,
    actorUserId,
    category: "organization",
    configKey: "settings",
    value: settings,
  });
}

async function seedWorkflowConfigurations(
  tx: SeedDb,
  organizationId: string,
  actorUserId: string,
  workflowBySlug: Map<string, { id: string; name: string; metadata: unknown }>,
) {
  const defaults = [
    {
      slug: "vendor-payment",
      name: "Vendor payment dynamic routing",
      config: {
        routingMode: "amount_and_vendor_risk",
        autoAssignRoles: ["finance-manager", "cfo"],
        requiredDocuments: ["invoice", "purchase_order", "gst_validation"],
        controls: { duplicateInvoiceCheck: true, budgetCheck: true },
      },
    },
    {
      slug: "expense-claim",
      name: "Expense claim policy controls",
      config: {
        routingMode: "category_and_amount",
        autoAssignRoles: ["manager", "finance-manager"],
        requiredDocuments: ["receipt"],
        controls: { gstInputCapture: true, policyExceptionFlag: true },
      },
    },
  ];

  for (const item of defaults) {
    const workflow = workflowBySlug.get(item.slug);
    if (!workflow) continue;

    await tx.workflowConfiguration.upsert({
      where: { workflowId_version: { workflowId: workflow.id, version: 1 } },
      create: {
        organizationId,
        workflowId: workflow.id,
        version: 1,
        name: item.name,
        config: asJson(item.config),
        isActive: true,
        createdById: actorUserId,
        metadata: asJson({ source: "enterprise_seed" }),
      },
      update: {
        name: item.name,
        config: asJson(item.config),
        isActive: true,
      },
    });

    await tx.workflow.update({
      where: { id: workflow.id },
      data: {
        metadata: asJson({
          ...recordFromJson(workflow.metadata),
          runtimeConfigurationVersion: 1,
          configurationSeeded: true,
        }),
      },
    });

    await upsertConfig(tx, {
      organizationId,
      actorUserId,
      category: "workflow",
      configKey: workflow.id,
      value: {
        workflowId: workflow.id,
        workflowSlug: item.slug,
        activeConfigurationVersion: 1,
        config: item.config,
      },
    });
  }
}

async function seedApprovalChains(
  tx: SeedDb,
  organizationId: string,
  cfoUserId: string,
  financeManagerUserId: string,
  workflowBySlug: Map<string, { id: string; name: string }>,
) {
  const vendorWorkflow = workflowBySlug.get("vendor-payment");
  const chain = await tx.approvalChain.upsert({
    where: { organizationId_slug: { organizationId, slug: "finance-high-value-chain" } },
    create: {
      organizationId,
      workflowId: vendorWorkflow?.id,
      name: "Finance high value approval chain",
      slug: "finance-high-value-chain",
      approvalType: "SEQUENTIAL",
      steps: asJson([
        {
          sequence: 1,
          label: "Finance manager validation",
          assigneeId: financeManagerUserId,
          assigneeRole: "finance-manager",
          required: true,
        },
        {
          sequence: 2,
          label: "CFO approval",
          assigneeId: cfoUserId,
          assigneeRole: "cfo",
          condition: { amountGte: 500_000 },
          required: true,
        },
      ]),
      metadata: asJson({ source: "enterprise_seed", builderVersion: 1 }),
    },
    update: {
      workflowId: vendorWorkflow?.id,
      steps: asJson([
        {
          sequence: 1,
          label: "Finance manager validation",
          assigneeId: financeManagerUserId,
          assigneeRole: "finance-manager",
          required: true,
        },
        {
          sequence: 2,
          label: "CFO approval",
          assigneeId: cfoUserId,
          assigneeRole: "cfo",
          condition: { amountGte: 500_000 },
          required: true,
        },
      ]),
    },
  });

  await upsertConfig(tx, {
    organizationId,
    actorUserId: cfoUserId,
    category: "approval",
    configKey: chain.slug,
    value: {
      approvalChainId: chain.id,
      approvalType: chain.approvalType,
      builderVersion: 1,
    },
  });
}

async function seedCustomRole(tx: SeedDb, organizationId: string, actorUserId: string) {
  const role = await tx.role.upsert({
    where: { organizationId_slug: { organizationId, slug: "finance-controller" } },
    create: {
      organizationId,
      name: "Finance Controller",
      slug: "finance-controller",
      description: "Custom tenant role for invoice, payment, expense, and audit controls.",
      isSystem: false,
      metadata: asJson({ source: "enterprise_seed" }),
    },
    update: {
      name: "Finance Controller",
      description: "Custom tenant role for invoice, payment, expense, and audit controls.",
    },
  });
  const permissions = await tx.permission.findMany({
    where: {
      OR: [
        { resource: "invoice", action: "manage" },
        { resource: "payment", action: "manage" },
        { resource: "expense", action: "manage" },
        { resource: "audit", action: "read" },
      ],
    },
    select: { id: true, resource: true, action: true },
  });

  await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
  await tx.rolePermission.createMany({
    data: permissions.map((permission) => ({
      roleId: role.id,
      permissionId: permission.id,
    })),
    skipDuplicates: true,
  });
  await upsertConfig(tx, {
    organizationId,
    actorUserId,
    category: "role",
    configKey: role.slug,
    value: {
      roleId: role.id,
      permissionKeys: permissions.map((permission) => `${permission.resource}:${permission.action}`),
    },
  });
}

async function seedNotificationPreferences(
  tx: SeedDb,
  organizationId: string,
  adminUserId: string,
  cfoUserId: string,
  financeManagerUserId: string,
) {
  const eventTypes = ["approval.pending", "approval.escalated", "report.ready"];
  const users = [adminUserId, cfoUserId, financeManagerUserId];

  for (const userId of users) {
    for (const eventType of eventTypes) {
      for (const channel of ["IN_APP", "EMAIL"] as const) {
        await tx.notificationPreference.upsert({
          where: {
            organizationId_userId_channel_eventType: {
              organizationId,
              userId,
              channel,
              eventType,
            },
          },
          create: {
            organizationId,
            userId,
            channel,
            eventType,
            enabled: true,
          },
          update: { enabled: true },
        });
      }
    }
  }

  await upsertConfig(tx, {
    organizationId,
    actorUserId: adminUserId,
    category: "notification",
    configKey: "defaults",
    value: {
      eventTypes,
      enabledChannels: ["IN_APP", "EMAIL"],
    },
  });
}

async function seedFinanceRules(
  tx: SeedDb,
  organizationId: string,
  actorUserId: string,
) {
  const rules = [
    {
      name: "High value payment requires CFO",
      ruleType: "approval_threshold",
      description: "Route payments above INR 500,000 through CFO approval.",
      thresholdAmount: 500_000,
      conditions: { entityType: "payment", amountGte: 500_000 },
      actions: { requireRole: "cfo", requireSecondApproval: true },
      priority: 10,
    },
    {
      name: "GST invoice validation",
      ruleType: "gst_control",
      description: "Require GSTIN and tax configuration checks before invoice approval.",
      thresholdAmount: null,
      conditions: { entityTypes: ["invoice", "expense"], gstApplicable: true },
      actions: { validateGstin: true, requireTaxConfiguration: true },
      priority: 20,
    },
  ];

  for (const rule of rules) {
    const row = await tx.financeRule.upsert({
      where: {
        organizationId_ruleType_name: {
          organizationId,
          ruleType: rule.ruleType,
          name: rule.name,
        },
      },
      create: {
        organizationId,
        name: rule.name,
        ruleType: rule.ruleType,
        description: rule.description,
        thresholdAmount: rule.thresholdAmount,
        conditions: asJson(rule.conditions),
        actions: asJson(rule.actions),
        priority: rule.priority,
        isActive: true,
        createdById: actorUserId,
        metadata: asJson({ source: "enterprise_seed" }),
      },
      update: {
        description: rule.description,
        thresholdAmount: rule.thresholdAmount,
        conditions: asJson(rule.conditions),
        actions: asJson(rule.actions),
        priority: rule.priority,
        isActive: true,
        deletedAt: null,
      },
    });

    await upsertConfig(tx, {
      organizationId,
      actorUserId,
      category: "finance",
      configKey: `${rule.ruleType}.${slugify(rule.name)}`,
      value: {
        financeRuleId: row.id,
        conditions: rule.conditions,
        actions: rule.actions,
      },
    });
  }
}

async function seedCustomFields(
  tx: SeedDb,
  organizationId: string,
  actorUserId: string,
) {
  const fields = [
    {
      entityType: "invoice",
      fieldKey: "cost_center",
      label: "Cost center",
      fieldType: "text",
      required: true,
      displayOrder: 10,
    },
    {
      entityType: "expense",
      fieldKey: "policy_exception_reason",
      label: "Policy exception reason",
      fieldType: "text",
      required: false,
      displayOrder: 20,
    },
    {
      entityType: "vendor",
      fieldKey: "risk_tier",
      label: "Vendor risk tier",
      fieldType: "select",
      required: true,
      options: { values: ["low", "medium", "high"] },
      displayOrder: 30,
    },
  ];

  for (const field of fields) {
    const row = await tx.customFieldDefinition.upsert({
      where: {
        organizationId_entityType_fieldKey: {
          organizationId,
          entityType: field.entityType,
          fieldKey: field.fieldKey,
        },
      },
      create: {
        organizationId,
        entityType: field.entityType,
        fieldKey: field.fieldKey,
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        options: field.options ? asJson(field.options) : Prisma.JsonNull,
        displayOrder: field.displayOrder,
        isActive: true,
        createdById: actorUserId,
        metadata: asJson({ source: "enterprise_seed" }),
      },
      update: {
        label: field.label,
        fieldType: field.fieldType,
        required: field.required,
        options: field.options ? asJson(field.options) : Prisma.JsonNull,
        displayOrder: field.displayOrder,
        isActive: true,
        deletedAt: null,
      },
    });

    await upsertConfig(tx, {
      organizationId,
      actorUserId,
      category: "custom_field",
      configKey: `${field.entityType}.${field.fieldKey}`,
      value: {
        customFieldId: row.id,
        label: row.label,
        fieldType: row.fieldType,
      },
    });
  }
}

async function seedSlaPolicies(
  tx: SeedDb,
  organizationId: string,
  actorUserId: string,
  workflowBySlug: Map<string, { id: string; name: string }>,
) {
  const policies = [
    {
      workflowSlug: "vendor-payment",
      entityType: "payment",
      priority: "high",
      targetMinutes: 480,
      escalationMinutes: 360,
      breachActions: { escalateToRole: "cfo", sendReminder: true },
    },
    {
      workflowSlug: "expense-claim",
      entityType: "expense",
      priority: "standard",
      targetMinutes: 1_440,
      escalationMinutes: 1_080,
      breachActions: { escalateToRole: "finance-manager", sendReminder: true },
    },
  ];

  for (const policy of policies) {
    const workflow = workflowBySlug.get(policy.workflowSlug);
    if (!workflow) continue;
    const existing = await tx.workflowSlaPolicy.findFirst({
      where: {
        organizationId,
        workflowId: workflow.id,
        entityType: policy.entityType,
        priority: policy.priority,
        deletedAt: null,
      },
      select: { id: true },
    });
    const row = existing
      ? await tx.workflowSlaPolicy.update({
          where: { id: existing.id },
          data: {
            targetMinutes: policy.targetMinutes,
            escalationMinutes: policy.escalationMinutes,
            breachActions: asJson(policy.breachActions),
            isActive: true,
          },
        })
      : await tx.workflowSlaPolicy.create({
          data: {
            organizationId,
            workflowId: workflow.id,
            entityType: policy.entityType,
            priority: policy.priority,
            targetMinutes: policy.targetMinutes,
            escalationMinutes: policy.escalationMinutes,
            breachActions: asJson(policy.breachActions),
            isActive: true,
            createdById: actorUserId,
            metadata: asJson({ source: "enterprise_seed" }),
          },
        });

    await upsertConfig(tx, {
      organizationId,
      actorUserId,
      category: "sla",
      configKey: row.id,
      value: {
        workflowId: workflow.id,
        entityType: policy.entityType,
        priority: policy.priority,
        targetMinutes: policy.targetMinutes,
        escalationMinutes: policy.escalationMinutes,
      },
    });
  }
}

async function seedDemoWalkthrough(
  tx: SeedDb,
  organizationId: string,
  actorUserId: string,
) {
  await upsertConfig(tx, {
    organizationId,
    actorUserId,
    category: "demo",
    configKey: "walkthrough",
    value: {
      title: "AI ERP OS enterprise demo",
      tenant: "Acme India Pvt Ltd",
      personas: [
        { email: "admin@acme-india.local", role: "Organization Admin" },
        { email: "cfo@acme-india.local", role: "CFO" },
        { email: "finance.manager@acme-india.local", role: "Finance Manager" },
        { email: "auditor@acme-india.local", role: "Auditor" },
      ],
      steps: [
        {
          route: "/dashboard",
          title: "Executive overview",
          talkingPoints: [
            "Role-aware dashboard changes with the active persona.",
            "Sandbox banner confirms demo-safe actions.",
          ],
        },
        {
          route: "/dashboard/finance",
          title: "Finance command center",
          talkingPoints: [
            "GST liability, outstanding invoices, vendor payments, budgets, and approval history come from Prisma data.",
            "Vendor records include GSTIN, PAN, payment terms, and risk metadata.",
          ],
        },
        {
          route: "/dashboard/approvals",
          title: "Workflow approvals",
          talkingPoints: [
            "Pending approvals are linked to real finance records.",
            "Reminder and report actions write audit logs.",
          ],
        },
        {
          route: "/dashboard/settings",
          title: "Configuration engine",
          talkingPoints: [
            "Admins can configure workflow routing, SLA policies, finance rules, and custom fields.",
            "Every setting is stored under the tenant organization.",
          ],
        },
      ],
    },
  });
}

async function upsertConfig(
  tx: SeedDb,
  params: {
    organizationId: string;
    actorUserId: string;
    category: string;
    configKey: string;
    value: unknown;
  },
) {
  const existing = await tx.organizationConfiguration.findUnique({
    where: {
      organizationId_category_configKey: {
        organizationId: params.organizationId,
        category: params.category,
        configKey: params.configKey,
      },
    },
    select: { version: true },
  });

  await tx.organizationConfiguration.upsert({
    where: {
      organizationId_category_configKey: {
        organizationId: params.organizationId,
        category: params.category,
        configKey: params.configKey,
      },
    },
    create: {
      organizationId: params.organizationId,
      category: params.category,
      configKey: params.configKey,
      value: asJson(params.value),
      version: 1,
      createdById: params.actorUserId,
      updatedById: params.actorUserId,
      metadata: asJson({ source: "enterprise_seed" }),
    },
    update: {
      value: asJson(params.value),
      version: (existing?.version ?? 0) + 1,
      updatedById: params.actorUserId,
    },
  });
}

function recordFromJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
