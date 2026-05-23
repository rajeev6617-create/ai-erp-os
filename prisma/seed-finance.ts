import type { PrismaClient } from "../app/generated/prisma/client";

const MINIMAL_APPROVAL_ENTITY_ID = "seed:vendor-payment:minimal-approval";
const MINIMAL_EXECUTION_IDEMPOTENCY_KEY = "seed:vendor-payment:minimal-execution";

export async function seedFinanceData(
  prisma: PrismaClient,
  organizationId: string,
  requesterId: string,
  financeApproverId: string,
  _cfoApproverId: string,
) {
  void _cfoApproverId;

  const workflow = await prisma.workflow.findFirstOrThrow({
    where: {
      organizationId,
      slug: "vendor-payment",
      version: 1,
      deletedAt: null,
    },
    select: { id: true, name: true },
  });

  const execution = await prisma.workflowExecution.upsert({
    where: {
      organizationId_idempotencyKey: {
        organizationId,
        idempotencyKey: MINIMAL_EXECUTION_IDEMPOTENCY_KEY,
      },
    },
    create: {
      organizationId,
      workflowId: workflow.id,
      idempotencyKey: MINIMAL_EXECUTION_IDEMPOTENCY_KEY,
      status: "WAITING_APPROVAL",
      priority: 55,
      triggeredBy: requesterId,
      triggerSource: "seed",
      startedAt: new Date(),
      context: {
        seedProfile: "production-minimal",
        amountInr: 125000,
      },
    },
    update: {
      workflowId: workflow.id,
      status: "WAITING_APPROVAL",
      priority: 55,
      completedAt: null,
      context: {
        seedProfile: "production-minimal",
        amountInr: 125000,
      },
    },
  });

  const existingApproval = await prisma.approval.findFirst({
    where: {
      organizationId,
      entityType: "workflow",
      entityId: MINIMAL_APPROVAL_ENTITY_ID,
    },
    select: { id: true },
  });
  const approvalData = {
    organizationId,
    executionId: execution.id,
    requesterId,
    title: "Seed approval - vendor payment",
    description: "Minimal deployment-safe approval for validating dashboard workflows.",
    entityType: "workflow",
    entityId: MINIMAL_APPROVAL_ENTITY_ID,
    status: "PENDING" as const,
    dueAt: hoursFromNow(24),
    completedAt: null,
    metadata: {
      seedProfile: "production-minimal",
      amountInr: 125000,
      priorityScore: 55,
    },
  };
  const approval = existingApproval
    ? await prisma.approval.update({
        where: { id: existingApproval.id },
        data: approvalData,
        select: { id: true },
      })
    : await prisma.approval.create({
        data: approvalData,
        select: { id: true },
      });

  await prisma.approvalStep.upsert({
    where: {
      approvalId_sequence: {
        approvalId: approval.id,
        sequence: 1,
      },
    },
    create: {
      approvalId: approval.id,
      sequence: 1,
      assigneeId: financeApproverId,
      assigneeRole: "organization-admin",
      status: "PENDING",
      metadata: { seedProfile: "production-minimal" },
    },
    update: {
      assigneeId: financeApproverId,
      assigneeRole: "organization-admin",
      status: "PENDING",
      actedAt: null,
      comment: null,
      metadata: { seedProfile: "production-minimal" },
    },
  });

  await Promise.all([
    ensureAuditLog(prisma, {
      organizationId,
      userId: requesterId,
      approvalId: approval.id,
      executionId: execution.id,
    }),
    ensureActivityLog(prisma, {
      organizationId,
      userId: requesterId,
      approvalId: approval.id,
    }),
  ]);

  console.log("  Approval: seeded one pending vendor payment approval");
}

async function ensureAuditLog(
  prisma: PrismaClient,
  params: {
    organizationId: string;
    userId: string;
    approvalId: string;
    executionId: string;
  },
) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      organizationId: params.organizationId,
      action: "approval.create",
      resource: "approval",
      resourceId: params.approvalId,
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      action: "approval.create",
      resource: "approval",
      resourceId: params.approvalId,
      severity: "INFO",
      after: {
        status: "PENDING",
        seedProfile: "production-minimal",
      },
      metadata: {
        source: "seed",
        note: "Inserted outside transaction for deployment safety.",
      },
      correlationId: params.executionId,
    },
  });
}

async function ensureActivityLog(
  prisma: PrismaClient,
  params: {
    organizationId: string;
    userId: string;
    approvalId: string;
  },
) {
  const existing = await prisma.activityLog.findFirst({
    where: {
      organizationId: params.organizationId,
      activityType: "CREATE",
      entityType: "approval",
      entityId: params.approvalId,
    },
    select: { id: true },
  });

  if (existing) return;

  await prisma.activityLog.create({
    data: {
      organizationId: params.organizationId,
      userId: params.userId,
      activityType: "CREATE",
      entityType: "approval",
      entityId: params.approvalId,
      description: "Seed approval submitted: vendor payment",
      metadata: {
        workflowState: "PENDING",
        seedProfile: "production-minimal",
      },
    },
  });
}

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
