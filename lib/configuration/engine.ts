import { z } from "zod";
import {
  NotificationChannel,
  Prisma,
  type ApprovalType,
} from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import {
  ACTIONS,
  RESOURCES,
  ROLE_ORG_ADMIN,
  ROLE_SUPER_ADMIN,
  type SystemRoleSlug,
} from "@/lib/auth/constants";

export const ADMIN_SETTINGS_ROLES = [
  ROLE_SUPER_ADMIN,
  ROLE_ORG_ADMIN,
] as const satisfies readonly SystemRoleSlug[];

const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.unknown()),
  z.record(z.string(), z.unknown()),
]);
const jsonObjectSchema = z.record(z.string(), z.unknown());
const configCategorySchema = z.enum([
  "organization",
  "workflow",
  "approval",
  "role",
  "notification",
  "finance",
  "custom_field",
  "sla",
]);

const organizationSettingsSchema = z.object({
  timezone: z.string().min(2).max(64).optional(),
  locale: z.string().min(2).max(16).optional(),
  currency: z.string().length(3).optional(),
  fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
  settings: jsonObjectSchema.optional(),
});

const workflowConfigurationSchema = z.object({
  workflowId: z.string().cuid(),
  name: z.string().min(2).max(120),
  config: jsonObjectSchema,
  activate: z.boolean().default(true),
});

const approvalStepSchema = z.object({
  label: z.string().min(2).max(120),
  sequence: z.number().int().min(1),
  assigneeRole: z.string().min(2).max(80).optional(),
  assigneeId: z.string().cuid().optional(),
  condition: jsonObjectSchema.optional(),
  required: z.boolean().default(true),
});

const approvalChainSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120).optional(),
  workflowId: z.string().cuid().optional(),
  approvalType: z
    .enum(["SEQUENTIAL", "PARALLEL", "ANY_ONE", "MAJORITY", "UNANIMOUS"])
    .default("SEQUENTIAL"),
  steps: z.array(approvalStepSchema).min(1).max(12),
  metadata: jsonObjectSchema.optional(),
});

const roleSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().max(240).optional(),
  permissionKeys: z
    .array(z.string().regex(/^[a-z_]+:[a-z_]+$/))
    .min(1)
    .max(40),
});

const notificationPreferenceSchema = z.object({
  preferences: z
    .array(
      z.object({
        channel: z.nativeEnum(NotificationChannel),
        eventType: z.string().min(2).max(80),
        enabled: z.boolean(),
      }),
    )
    .min(1)
    .max(40),
});

const financeRuleSchema = z.object({
  name: z.string().min(2).max(120),
  ruleType: z.string().min(2).max(80),
  description: z.string().max(300).optional(),
  thresholdAmount: z.number().nonnegative().optional(),
  conditions: jsonObjectSchema,
  actions: jsonObjectSchema,
  priority: z.number().int().min(1).max(999).default(100),
  isActive: z.boolean().default(true),
});

const customFieldSchema = z.object({
  entityType: z.string().min(2).max(80),
  fieldKey: z.string().min(2).max(80).regex(/^[a-z][a-z0-9_]*$/),
  label: z.string().min(2).max(120),
  fieldType: z.enum(["text", "number", "date", "select", "boolean", "currency", "json"]),
  required: z.boolean().default(false),
  options: jsonObjectSchema.optional(),
  validation: jsonObjectSchema.optional(),
  defaultValue: settingValueSchema.optional(),
  displayOrder: z.number().int().min(1).max(999).default(100),
  isActive: z.boolean().default(true),
});

const slaPolicySchema = z.object({
  id: z.string().cuid().optional(),
  workflowId: z.string().cuid().optional(),
  entityType: z.string().min(2).max(80).optional(),
  priority: z.string().min(2).max(40).optional(),
  targetMinutes: z.number().int().min(15).max(43_200),
  escalationMinutes: z.number().int().min(15).max(43_200),
  breachActions: jsonObjectSchema.optional(),
  isActive: z.boolean().default(true),
});

const genericConfigSchema = z.object({
  category: configCategorySchema,
  configKey: z.string().min(2).max(120).regex(/^[a-z][a-z0-9_.-]*$/),
  value: settingValueSchema,
  schema: jsonObjectSchema.optional(),
  isEncrypted: z.boolean().default(false),
});

export const configurationMutationSchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("organization"), data: organizationSettingsSchema }),
  z.object({ section: z.literal("workflow"), data: workflowConfigurationSchema }),
  z.object({ section: z.literal("approvalChain"), data: approvalChainSchema }),
  z.object({ section: z.literal("role"), data: roleSchema }),
  z.object({ section: z.literal("notifications"), data: notificationPreferenceSchema }),
  z.object({ section: z.literal("financeRule"), data: financeRuleSchema }),
  z.object({ section: z.literal("customField"), data: customFieldSchema }),
  z.object({ section: z.literal("sla"), data: slaPolicySchema }),
  z.object({ section: z.literal("configuration"), data: genericConfigSchema }),
]);

export type ConfigurationMutationInput = z.infer<typeof configurationMutationSchema>;

export interface ConfigurationDashboardData {
  organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    locale: string;
    currency: string;
    fiscalYearStartMonth: number;
    settings: Record<string, unknown>;
  };
  summary: {
    configurableWorkflows: number;
    approvalChains: number;
    customRoles: number;
    notificationPreferences: number;
    financeRules: number;
    customFields: number;
    slaPolicies: number;
    storedConfigurations: number;
  };
  workflows: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    triggerType: string;
    version: number;
    activeConfigurationName: string | null;
    activeConfigurationVersion: number | null;
  }>;
  approvalChains: Array<{
    id: string;
    name: string;
    slug: string;
    approvalType: string;
    workflowName: string | null;
    stepCount: number;
  }>;
  roles: Array<{
    id: string;
    name: string;
    slug: string;
    isSystem: boolean;
    permissionCount: number;
  }>;
  availablePermissions: Array<{
    key: string;
    resource: string;
    action: string;
  }>;
  notificationPreferences: Array<{
    id: string;
    channel: string;
    eventType: string;
    enabled: boolean;
  }>;
  financeRules: Array<{
    id: string;
    name: string;
    ruleType: string;
    thresholdAmount: number | null;
    priority: number;
    isActive: boolean;
  }>;
  customFields: Array<{
    id: string;
    entityType: string;
    fieldKey: string;
    label: string;
    fieldType: string;
    required: boolean;
    isActive: boolean;
  }>;
  slaPolicies: Array<{
    id: string;
    workflowName: string;
    entityType: string | null;
    priority: string | null;
    targetMinutes: number;
    escalationMinutes: number;
    isActive: boolean;
  }>;
  storedConfigurations: Array<{
    id: string;
    category: string;
    configKey: string;
    version: number;
    updatedAt: string;
  }>;
}

export async function getConfigurationDashboard(params: {
  organizationId: string;
  userId: string;
}): Promise<ConfigurationDashboardData> {
  const [
    organization,
    workflows,
    approvalChains,
    roles,
    permissions,
    preferences,
    financeRules,
    customFields,
    slaPolicies,
    storedConfigurations,
  ] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: params.organizationId },
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        locale: true,
        currency: true,
        fiscalYearStartMonth: true,
        settings: true,
      },
    }),
    prisma.workflow.findMany({
      where: { organizationId: params.organizationId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        triggerType: true,
        version: true,
        configurations: {
          where: { isActive: true },
          orderBy: { version: "desc" },
          select: { name: true, version: true },
          take: 1,
        },
      },
      orderBy: [{ name: "asc" }, { version: "desc" }],
    }),
    prisma.approvalChain.findMany({
      where: { organizationId: params.organizationId, deletedAt: null },
      include: { workflow: { select: { name: true } } },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      take: 20,
    }),
    prisma.role.findMany({
      where: { organizationId: params.organizationId, deletedAt: null },
      include: { rolePermissions: { select: { permissionId: true } } },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    }),
    prisma.permission.findMany({
      where: {
        resource: { in: [...RESOURCES] },
        action: { in: [...ACTIONS] },
      },
      select: { resource: true, action: true },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    }),
    prisma.notificationPreference.findMany({
      where: { organizationId: params.organizationId, userId: params.userId },
      orderBy: [{ eventType: "asc" }, { channel: "asc" }],
    }),
    prisma.financeRule.findMany({
      where: { organizationId: params.organizationId, deletedAt: null },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
      take: 20,
    }),
    prisma.customFieldDefinition.findMany({
      where: { organizationId: params.organizationId, deletedAt: null },
      orderBy: [{ entityType: "asc" }, { displayOrder: "asc" }],
      take: 30,
    }),
    prisma.workflowSlaPolicy.findMany({
      where: { organizationId: params.organizationId, deletedAt: null },
      include: { workflow: { select: { name: true } } },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      take: 20,
    }),
    prisma.organizationConfiguration.findMany({
      where: { organizationId: params.organizationId },
      orderBy: [{ category: "asc" }, { configKey: "asc" }],
      take: 40,
    }),
  ]);

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      timezone: organization.timezone,
      locale: organization.locale,
      currency: organization.currency,
      fiscalYearStartMonth: organization.fiscalYearStartMonth,
      settings: recordFromJson(organization.settings),
    },
    summary: {
      configurableWorkflows: workflows.length,
      approvalChains: approvalChains.length,
      customRoles: roles.filter((role) => !role.isSystem).length,
      notificationPreferences: preferences.length,
      financeRules: financeRules.length,
      customFields: customFields.length,
      slaPolicies: slaPolicies.length,
      storedConfigurations: storedConfigurations.length,
    },
    workflows: workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      slug: workflow.slug,
      status: workflow.status,
      triggerType: workflow.triggerType,
      version: workflow.version,
      activeConfigurationName: workflow.configurations[0]?.name ?? null,
      activeConfigurationVersion: workflow.configurations[0]?.version ?? null,
    })),
    approvalChains: approvalChains.map((chain) => ({
      id: chain.id,
      name: chain.name,
      slug: chain.slug,
      approvalType: chain.approvalType,
      workflowName: chain.workflow?.name ?? null,
      stepCount: Array.isArray(chain.steps) ? chain.steps.length : 0,
    })),
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      isSystem: role.isSystem,
      permissionCount: role.rolePermissions.length,
    })),
    availablePermissions: permissions.map((permission) => ({
      key: `${permission.resource}:${permission.action}`,
      resource: permission.resource,
      action: permission.action,
    })),
    notificationPreferences: preferences.map((preference) => ({
      id: preference.id,
      channel: preference.channel,
      eventType: preference.eventType,
      enabled: preference.enabled,
    })),
    financeRules: financeRules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      ruleType: rule.ruleType,
      thresholdAmount: decimalToNumberOrNull(rule.thresholdAmount),
      priority: rule.priority,
      isActive: rule.isActive,
    })),
    customFields: customFields.map((field) => ({
      id: field.id,
      entityType: field.entityType,
      fieldKey: field.fieldKey,
      label: field.label,
      fieldType: field.fieldType,
      required: field.required,
      isActive: field.isActive,
    })),
    slaPolicies: slaPolicies.map((policy) => ({
      id: policy.id,
      workflowName: policy.workflow?.name ?? "All workflows",
      entityType: policy.entityType,
      priority: policy.priority,
      targetMinutes: policy.targetMinutes,
      escalationMinutes: policy.escalationMinutes,
      isActive: policy.isActive,
    })),
    storedConfigurations: storedConfigurations.map((config) => ({
      id: config.id,
      category: config.category,
      configKey: config.configKey,
      version: config.version,
      updatedAt: config.updatedAt.toISOString(),
    })),
  };
}

export async function applyConfigurationMutation(params: {
  organizationId: string;
  actorUserId: string;
  input: ConfigurationMutationInput;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  switch (params.input.section) {
    case "organization":
      return updateOrganizationSettings(params, params.input.data);
    case "workflow":
      return createWorkflowConfiguration(params, params.input.data);
    case "approvalChain":
      return upsertApprovalChain(params, params.input.data);
    case "role":
      return upsertCustomRole(params, params.input.data);
    case "notifications":
      return upsertNotificationPreferences(params, params.input.data);
    case "financeRule":
      return upsertFinanceRule(params, params.input.data);
    case "customField":
      return upsertCustomField(params, params.input.data);
    case "sla":
      return upsertSlaPolicy(params, params.input.data);
    case "configuration":
      return upsertGenericConfiguration(params, params.input.data);
  }
}

async function updateOrganizationSettings(
  params: MutationContext,
  data: z.infer<typeof organizationSettingsSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.organization.findUniqueOrThrow({
      where: { id: params.organizationId },
      select: { settings: true },
    });
    const mergedSettings = {
      ...recordFromJson(current.settings),
      ...(data.settings ?? {}),
    };
    const organization = await tx.organization.update({
      where: { id: params.organizationId },
      data: {
        timezone: data.timezone,
        locale: data.locale,
        currency: data.currency,
        fiscalYearStartMonth: data.fiscalYearStartMonth,
        settings: asJson(mergedSettings),
      },
      select: {
        id: true,
        timezone: true,
        locale: true,
        currency: true,
        fiscalYearStartMonth: true,
      },
    });

    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "organization",
      configKey: "settings",
      value: {
        timezone: organization.timezone,
        locale: organization.locale,
        currency: organization.currency,
        fiscalYearStartMonth: organization.fiscalYearStartMonth,
        settings: mergedSettings,
      },
    });
    await auditConfigurationChange(tx, params, "organization", organization.id, {
      settings: mergedSettings,
    });

    return { section: "organization", organization };
  });
}

async function createWorkflowConfiguration(
  params: MutationContext,
  data: z.infer<typeof workflowConfigurationSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const workflow = await tx.workflow.findFirst({
      where: {
        id: data.workflowId,
        organizationId: params.organizationId,
        deletedAt: null,
      },
      select: { id: true, name: true, metadata: true },
    });
    if (!workflow) throw new NotFoundError("Workflow not found", "WORKFLOW_NOT_FOUND");

    const version = await tx.workflowConfiguration.aggregate({
      where: { workflowId: workflow.id },
      _max: { version: true },
    });
    if (data.activate) {
      await tx.workflowConfiguration.updateMany({
        where: { workflowId: workflow.id, isActive: true },
        data: { isActive: false },
      });
    }

    const created = await tx.workflowConfiguration.create({
      data: {
        organizationId: params.organizationId,
        workflowId: workflow.id,
        version: (version._max.version ?? 0) + 1,
        name: data.name,
        config: asJson(data.config),
        isActive: data.activate,
        createdById: params.actorUserId,
        metadata: asJson({
          source: "admin_settings",
          activationMode: data.activate ? "active" : "draft",
        }),
      },
      select: { id: true, name: true, version: true, isActive: true },
    });

    await tx.workflow.update({
      where: { id: workflow.id },
      data: {
        metadata: asJson({
          ...recordFromJson(workflow.metadata),
          runtimeConfigurationId: created.id,
          runtimeConfigurationVersion: created.version,
        }),
      },
    });
    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "workflow",
      configKey: workflow.id,
      value: {
        workflowId: workflow.id,
        activeConfigurationId: created.id,
        activeConfigurationVersion: created.version,
        config: data.config,
      },
    });
    await auditConfigurationChange(tx, params, "workflow", created.id, {
      workflowId: workflow.id,
      workflowName: workflow.name,
      version: created.version,
    });

    return { section: "workflow", workflowConfiguration: created };
  });
}

async function upsertApprovalChain(
  params: MutationContext,
  data: z.infer<typeof approvalChainSchema>,
) {
  return prisma.$transaction(async (tx) => {
    if (data.workflowId) {
      const workflow = await tx.workflow.findFirst({
        where: { id: data.workflowId, organizationId: params.organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!workflow) throw new NotFoundError("Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    const slug = data.slug ?? slugify(data.name);
    const chain = await tx.approvalChain.upsert({
      where: { organizationId_slug: { organizationId: params.organizationId, slug } },
      create: {
        organizationId: params.organizationId,
        workflowId: data.workflowId,
        name: data.name,
        slug,
        approvalType: data.approvalType as ApprovalType,
        steps: asJson(data.steps),
        metadata: asJson({
          ...(data.metadata ?? {}),
          source: "admin_settings",
          builderVersion: 1,
        }),
      },
      update: {
        workflowId: data.workflowId,
        name: data.name,
        approvalType: data.approvalType as ApprovalType,
        steps: asJson(data.steps),
        metadata: asJson({
          ...(data.metadata ?? {}),
          source: "admin_settings",
          builderVersion: 1,
        }),
      },
      select: { id: true, name: true, slug: true, approvalType: true },
    });

    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "approval",
      configKey: slug,
      value: {
        approvalChainId: chain.id,
        approvalType: chain.approvalType,
        steps: data.steps,
      },
    });
    await auditConfigurationChange(tx, params, "approval_chain", chain.id, {
      slug: chain.slug,
      stepCount: data.steps.length,
    });

    return { section: "approvalChain", approvalChain: chain };
  });
}

async function upsertCustomRole(
  params: MutationContext,
  data: z.infer<typeof roleSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const slug = data.slug ?? slugify(data.name);
    const existing = await tx.role.findUnique({
      where: {
        organizationId_slug: { organizationId: params.organizationId, slug },
      },
      select: { id: true, isSystem: true },
    });
    if (existing?.isSystem) {
      throw new ConflictError("System roles cannot be modified from settings", "SYSTEM_ROLE_LOCKED");
    }

    const permissionPairs = data.permissionKeys.map((key) => {
      const [resource, action] = key.split(":");
      return { resource, action };
    });
    const permissions = await tx.permission.findMany({
      where: { OR: permissionPairs },
      select: { id: true, resource: true, action: true },
    });
    if (permissions.length !== data.permissionKeys.length) {
      throw new NotFoundError("One or more permissions were not found", "PERMISSION_NOT_FOUND");
    }

    const role = await tx.role.upsert({
      where: { organizationId_slug: { organizationId: params.organizationId, slug } },
      create: {
        organizationId: params.organizationId,
        name: data.name,
        slug,
        description: data.description,
        isSystem: false,
        metadata: asJson({ source: "admin_settings", createdById: params.actorUserId }),
      },
      update: {
        name: data.name,
        description: data.description,
        metadata: asJson({ source: "admin_settings", updatedById: params.actorUserId }),
      },
      select: { id: true, name: true, slug: true },
    });

    await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });
    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "role",
      configKey: role.slug,
      value: {
        roleId: role.id,
        permissionKeys: data.permissionKeys,
      },
    });
    await auditConfigurationChange(tx, params, "role", role.id, {
      slug: role.slug,
      permissionCount: data.permissionKeys.length,
    });

    return { section: "role", role };
  });
}

async function upsertNotificationPreferences(
  params: MutationContext,
  data: z.infer<typeof notificationPreferenceSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const preferences = [];
    for (const preference of data.preferences) {
      preferences.push(
        await tx.notificationPreference.upsert({
          where: {
            organizationId_userId_channel_eventType: {
              organizationId: params.organizationId,
              userId: params.actorUserId,
              channel: preference.channel,
              eventType: preference.eventType,
            },
          },
          create: {
            organizationId: params.organizationId,
            userId: params.actorUserId,
            channel: preference.channel,
            eventType: preference.eventType,
            enabled: preference.enabled,
          },
          update: { enabled: preference.enabled },
          select: { id: true, channel: true, eventType: true, enabled: true },
        }),
      );
    }

    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "notification",
      configKey: `user.${params.actorUserId}`,
      value: { preferences: data.preferences },
    });
    await auditConfigurationChange(tx, params, "notification_preferences", params.actorUserId, {
      preferenceCount: preferences.length,
    });

    return { section: "notifications", preferences };
  });
}

async function upsertFinanceRule(
  params: MutationContext,
  data: z.infer<typeof financeRuleSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const rule = await tx.financeRule.upsert({
      where: {
        organizationId_ruleType_name: {
          organizationId: params.organizationId,
          ruleType: data.ruleType,
          name: data.name,
        },
      },
      create: {
        organizationId: params.organizationId,
        name: data.name,
        ruleType: data.ruleType,
        description: data.description,
        thresholdAmount: data.thresholdAmount,
        conditions: asJson(data.conditions),
        actions: asJson(data.actions),
        priority: data.priority,
        isActive: data.isActive,
        createdById: params.actorUserId,
        metadata: asJson({ source: "admin_settings" }),
      },
      update: {
        description: data.description,
        thresholdAmount: data.thresholdAmount,
        conditions: asJson(data.conditions),
        actions: asJson(data.actions),
        priority: data.priority,
        isActive: data.isActive,
        deletedAt: null,
      },
      select: { id: true, name: true, ruleType: true, priority: true, isActive: true },
    });

    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "finance",
      configKey: `${data.ruleType}.${slugify(data.name)}`,
      value: {
        financeRuleId: rule.id,
        thresholdAmount: data.thresholdAmount ?? null,
        conditions: data.conditions,
        actions: data.actions,
      },
    });
    await auditConfigurationChange(tx, params, "finance_rule", rule.id, {
      ruleType: rule.ruleType,
      name: rule.name,
    });

    return { section: "financeRule", financeRule: rule };
  });
}

async function upsertCustomField(
  params: MutationContext,
  data: z.infer<typeof customFieldSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const field = await tx.customFieldDefinition.upsert({
      where: {
        organizationId_entityType_fieldKey: {
          organizationId: params.organizationId,
          entityType: data.entityType,
          fieldKey: data.fieldKey,
        },
      },
      create: {
        organizationId: params.organizationId,
        entityType: data.entityType,
        fieldKey: data.fieldKey,
        label: data.label,
        fieldType: data.fieldType,
        required: data.required,
        options: asNullableJson(data.options),
        validation: asNullableJson(data.validation),
        defaultValue: asNullableJson(data.defaultValue),
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        createdById: params.actorUserId,
        metadata: asJson({ source: "admin_settings" }),
      },
      update: {
        label: data.label,
        fieldType: data.fieldType,
        required: data.required,
        options: asNullableJson(data.options),
        validation: asNullableJson(data.validation),
        defaultValue: asNullableJson(data.defaultValue),
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        deletedAt: null,
      },
      select: { id: true, entityType: true, fieldKey: true, label: true, fieldType: true },
    });

    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "custom_field",
      configKey: `${field.entityType}.${field.fieldKey}`,
      value: {
        customFieldId: field.id,
        label: field.label,
        fieldType: field.fieldType,
        required: data.required,
      },
    });
    await auditConfigurationChange(tx, params, "custom_field", field.id, {
      entityType: field.entityType,
      fieldKey: field.fieldKey,
    });

    return { section: "customField", customField: field };
  });
}

async function upsertSlaPolicy(
  params: MutationContext,
  data: z.infer<typeof slaPolicySchema>,
) {
  return prisma.$transaction(async (tx) => {
    if (data.workflowId) {
      const workflow = await tx.workflow.findFirst({
        where: { id: data.workflowId, organizationId: params.organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!workflow) throw new NotFoundError("Workflow not found", "WORKFLOW_NOT_FOUND");
    }

    const policy = data.id
      ? await tx.workflowSlaPolicy.update({
          where: { id: data.id, organizationId: params.organizationId },
          data: {
            workflowId: data.workflowId,
            entityType: data.entityType,
            priority: data.priority,
            targetMinutes: data.targetMinutes,
            escalationMinutes: data.escalationMinutes,
            breachActions: asNullableJson(data.breachActions),
            isActive: data.isActive,
            deletedAt: null,
          },
          select: { id: true, workflowId: true, targetMinutes: true, escalationMinutes: true },
        })
      : await tx.workflowSlaPolicy.create({
          data: {
            organizationId: params.organizationId,
            workflowId: data.workflowId,
            entityType: data.entityType,
            priority: data.priority,
            targetMinutes: data.targetMinutes,
            escalationMinutes: data.escalationMinutes,
            breachActions: asNullableJson(data.breachActions),
            isActive: data.isActive,
            createdById: params.actorUserId,
            metadata: asJson({ source: "admin_settings" }),
          },
          select: { id: true, workflowId: true, targetMinutes: true, escalationMinutes: true },
        });

    await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: "sla",
      configKey: policy.id,
      value: {
        workflowId: policy.workflowId,
        targetMinutes: policy.targetMinutes,
        escalationMinutes: policy.escalationMinutes,
        breachActions: data.breachActions ?? {},
      },
    });
    await auditConfigurationChange(tx, params, "workflow_sla_policy", policy.id, {
      targetMinutes: policy.targetMinutes,
      escalationMinutes: policy.escalationMinutes,
    });

    return { section: "sla", slaPolicy: policy };
  });
}

async function upsertGenericConfiguration(
  params: MutationContext,
  data: z.infer<typeof genericConfigSchema>,
) {
  return prisma.$transaction(async (tx) => {
    const row = await upsertConfigurationRow(tx, {
      organizationId: params.organizationId,
      actorUserId: params.actorUserId,
      category: data.category,
      configKey: data.configKey,
      value: data.value,
      schema: data.schema,
      isEncrypted: data.isEncrypted,
    });
    await auditConfigurationChange(tx, params, "configuration", row.id, {
      category: row.category,
      configKey: row.configKey,
      version: row.version,
    });

    return { section: "configuration", configuration: row };
  });
}

async function upsertConfigurationRow(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actorUserId: string;
    category: string;
    configKey: string;
    value: unknown;
    schema?: unknown;
    isEncrypted?: boolean;
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

  return tx.organizationConfiguration.upsert({
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
      schema: asNullableJson(params.schema),
      version: 1,
      isEncrypted: params.isEncrypted ?? false,
      createdById: params.actorUserId,
      updatedById: params.actorUserId,
      metadata: asJson({ source: "configuration_engine" }),
    },
    update: {
      value: asJson(params.value),
      schema: asNullableJson(params.schema),
      version: (existing?.version ?? 0) + 1,
      isEncrypted: params.isEncrypted ?? false,
      updatedById: params.actorUserId,
    },
    select: {
      id: true,
      category: true,
      configKey: true,
      version: true,
      updatedAt: true,
    },
  });
}

async function auditConfigurationChange(
  tx: Prisma.TransactionClient,
  params: MutationContext,
  resource: string,
  resourceId: string,
  after: Record<string, unknown>,
) {
  await tx.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.actorUserId,
      action: "configuration.update",
      resource,
      resourceId,
      severity: "INFO",
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      after: asJson(after),
      metadata: asJson({
        source: "configuration_engine",
        route: "/api/settings/configuration",
      }),
    },
  });
}

type MutationContext = {
  organizationId: string;
  actorUserId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function recordFromJson(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function asNullableJson(
  value: unknown,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === undefined || value === null) return Prisma.JsonNull;
  return asJson(value);
}

function decimalToNumberOrNull(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  if (typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
