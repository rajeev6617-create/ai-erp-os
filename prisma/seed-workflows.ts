import type { PrismaClient } from "../app/generated/prisma/client";

export async function seedWorkflows(
  prisma: PrismaClient,
  organizationId: string,
  adminUserId: string,
  financeUserId?: string,
) {
  const assigneeId = financeUserId ?? adminUserId;

  const workflows = await Promise.all([
    prisma.workflow.upsert({
      where: {
        organizationId_slug_version: {
          organizationId,
          slug: "vendor-payment",
          version: 1,
        },
      },
      create: {
        organizationId,
        name: "Vendor Payment Approval",
        slug: "vendor-payment",
        version: 1,
        status: "ACTIVE",
        triggerType: "manual",
        definition: { steps: ["validate", "approve", "pay"] },
        tags: ["finance", "payments"],
      },
      update: { status: "ACTIVE" },
    }),
    prisma.workflow.upsert({
      where: {
        organizationId_slug_version: {
          organizationId,
          slug: "expense-claim",
          version: 1,
        },
      },
      create: {
        organizationId,
        name: "Expense Claim",
        slug: "expense-claim",
        version: 1,
        status: "ACTIVE",
        triggerType: "manual",
        definition: { steps: ["submit", "manager_approve", "finance_approve"] },
        tags: ["hr", "expense"],
      },
      update: { status: "ACTIVE" },
    }),
    prisma.workflow.upsert({
      where: {
        organizationId_slug_version: {
          organizationId,
          slug: "payroll-processing",
          version: 1,
        },
      },
      create: {
        organizationId,
        name: "Payroll Processing",
        slug: "payroll-processing",
        version: 1,
        status: "ACTIVE",
        triggerType: "schedule",
        definition: { steps: ["calculate", "approve", "disburse"] },
        tags: ["hr", "payroll"],
      },
      update: { status: "ACTIVE" },
    }),
  ]);

  const existing = await prisma.approval.count({ where: { organizationId } });
  if (existing >= 5) {
    console.log("  Workflows: already seeded, skipping");
    return;
  }

  const now = new Date();
  const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const in1d = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const scenarios: Array<{
    workflowIdx: number;
    title: string;
    entityType: string;
    status: "PENDING" | "REJECTED" | "APPROVED";
    executionStatus: "WAITING_APPROVAL" | "FAILED" | "COMPLETED" | "RUNNING";
    priorityScore: number;
    dueAt?: Date;
    completedAt?: Date;
    amount: number;
  }> = [
    {
      workflowIdx: 0,
      title: "Vendor payment — TCS Ltd",
      entityType: "payment",
      status: "PENDING",
      executionStatus: "WAITING_APPROVAL",
      priorityScore: 85,
      dueAt: in2h,
      amount: 1250000,
    },
    {
      workflowIdx: 1,
      title: "Expense claim — Mumbai travel",
      entityType: "expense",
      status: "PENDING",
      executionStatus: "WAITING_APPROVAL",
      priorityScore: 45,
      dueAt: in1d,
      amount: 48500,
    },
    {
      workflowIdx: 0,
      title: "Purchase order — IT equipment",
      entityType: "procurement",
      status: "PENDING",
      executionStatus: "WAITING_APPROVAL",
      priorityScore: 55,
      dueAt: in1d,
      amount: 890000,
    },
    {
      workflowIdx: 1,
      title: "Invoice discount approval",
      entityType: "invoice",
      status: "PENDING",
      executionStatus: "WAITING_APPROVAL",
      priorityScore: 40,
      dueAt: in2h,
      amount: 320000,
    },
    {
      workflowIdx: 1,
      title: "Travel advance — rejected (missing receipts)",
      entityType: "expense",
      status: "REJECTED",
      executionStatus: "FAILED",
      priorityScore: 30,
      completedAt: yesterday,
      amount: 22000,
    },
    {
      workflowIdx: 0,
      title: "Office supplies — Q4",
      entityType: "payment",
      status: "APPROVED",
      executionStatus: "COMPLETED",
      priorityScore: 25,
      completedAt: yesterday,
      amount: 156000,
    },
    {
      workflowIdx: 2,
      title: "February payroll run",
      entityType: "payroll",
      status: "APPROVED",
      executionStatus: "COMPLETED",
      priorityScore: 90,
      completedAt: yesterday,
      amount: 4200000,
    },
  ];

  for (const s of scenarios) {
    const workflow = workflows[s.workflowIdx];
    const execution = await prisma.workflowExecution.create({
      data: {
        organizationId,
        workflowId: workflow.id,
        status: s.executionStatus,
        priority: s.priorityScore,
        triggeredBy: adminUserId,
        triggerSource: "seed",
        startedAt: yesterday,
        completedAt: s.completedAt,
        context: { amountInr: s.amount },
      },
    });

    const approval = await prisma.approval.create({
      data: {
        organizationId,
        executionId: execution.id,
        requesterId: adminUserId,
        title: s.title,
        description: `Amount: ₹${s.amount.toLocaleString("en-IN")}`,
        entityType: s.entityType,
        entityId: execution.id,
        status: s.status,
        dueAt: s.dueAt,
        completedAt: s.completedAt,
        metadata: {
          priorityScore: s.priorityScore,
          amountInr: s.amount,
          riskScore: Math.min(100, s.priorityScore + 10),
        },
      },
    });

    await prisma.approvalStep.create({
      data: {
        approvalId: approval.id,
        sequence: 1,
        assigneeId: assigneeId,
        status: s.status === "PENDING" ? "PENDING" : s.status,
        actedAt: s.status !== "PENDING" ? s.completedAt ?? now : null,
        comment:
          s.status === "REJECTED"
            ? "Missing supporting documents"
            : s.status === "APPROVED"
              ? "Approved per policy"
              : null,
      },
    });
  }

  console.log("  Workflows: seeded executions and approvals");
}
