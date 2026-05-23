import type {
  NotificationChannel,
  NotificationStatus,
  Prisma,
  PrismaClient,
} from "@/app/generated/prisma/client";
import { writeAuditLog } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";

type NotificationDb = PrismaClient | Prisma.TransactionClient;

export type NotificationEventType =
  | "approval.approve"
  | "approval.reject"
  | "approval.escalate"
  | "approval.request_clarification"
  | "approval.reminder"
  | "report.export";

export interface NotificationRecipient {
  userId: string;
  email?: string | null;
  phone?: string | null;
}

export interface NotificationDispatchInput {
  organizationId: string;
  actorUserId?: string | null;
  recipients: NotificationRecipient[];
  eventType: NotificationEventType;
  title: string;
  body: string;
  actionUrl?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  payload?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
}

export interface DispatchResult {
  inAppCount: number;
  emailCount: number;
  whatsappPlaceholderCount: number;
  scheduledReminderCount: number;
}

export async function dispatchWorkflowNotifications(
  input: NotificationDispatchInput,
  db: NotificationDb = prisma,
): Promise<DispatchResult> {
  const recipients = uniqueRecipients(input.recipients);
  if (recipients.length === 0) {
    return {
      inAppCount: 0,
      emailCount: 0,
      whatsappPlaceholderCount: 0,
      scheduledReminderCount: 0,
    };
  }

  const inAppRows = await createNotificationRows({
    ...input,
    recipients,
    channel: "IN_APP",
    status: "PENDING",
  }, db);
  const emailRows = await createNotificationRows({
    ...input,
    recipients,
    channel: "EMAIL",
    status: "PENDING",
  }, db);
  await createNotificationOutbox({
    ...input,
    recipients,
    channel: "EMAIL",
    outboxType: "notification.email",
  }, db);
  const whatsappPlaceholderCount = await queueWhatsAppPlaceholder(input, db);

  return {
    inAppCount: inAppRows,
    emailCount: emailRows,
    whatsappPlaceholderCount,
    scheduledReminderCount: 0,
  };
}

export async function scheduleWorkflowReminder(
  input: NotificationDispatchInput & { scheduledAt?: Date },
  db: NotificationDb = prisma,
): Promise<DispatchResult> {
  const recipients = uniqueRecipients(input.recipients);
  const scheduledAt = input.scheduledAt ?? new Date();

  if (recipients.length === 0) {
    return {
      inAppCount: 0,
      emailCount: 0,
      whatsappPlaceholderCount: 0,
      scheduledReminderCount: 0,
    };
  }

  const inAppRows = await createNotificationRows({
    ...input,
    recipients,
    channel: "IN_APP",
    status: "PENDING",
  }, db);
  const emailRows = await createNotificationRows({
    ...input,
    recipients,
    channel: "EMAIL",
    status: "PENDING",
  }, db);
  await createNotificationOutbox({
    ...input,
    recipients,
    channel: "EMAIL",
    outboxType: "notification.email.placeholder",
  }, db);
  await db.eventOutbox.create({
    data: {
      organizationId: input.organizationId,
      eventType: "notification.reminder.scheduled",
      payload: {
        eventType: input.eventType,
        recipients,
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        payload: toInputJsonObject(input.payload),
      } as unknown as Prisma.InputJsonObject,
      scheduledAt,
    },
  });
  await writeNotificationAudit({
    ...input,
    channel: "IN_APP",
    count: recipients.length,
    status: "PENDING",
    metadata: { scheduledAt: scheduledAt.toISOString(), eventType: input.eventType },
  }, db);
  const whatsappPlaceholderCount = await queueWhatsAppPlaceholder(
    { ...input, recipients },
    db,
  );

  return {
    inAppCount: inAppRows,
    emailCount: emailRows,
    whatsappPlaceholderCount,
    scheduledReminderCount: recipients.length,
  };
}

export async function auditReportDelivery(input: {
  organizationId: string;
  actorUserId?: string | null;
  reportType: "excel_mis" | "pdf_summary_placeholder";
  scope: string;
  fileName: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await writeAuditLog({
    organizationId: input.organizationId,
    userId: input.actorUserId ?? null,
    action: `report.${input.reportType}.export`,
    resource: "report",
    resourceId: input.fileName,
    severity: "INFO",
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    after: {
      reportType: input.reportType,
      scope: input.scope,
      fileName: input.fileName,
    },
    metadata: input.metadata,
    correlationId: `report:${input.reportType}:${input.scope}`,
  });
}

async function createNotificationRows(
  input: NotificationDispatchInput & {
    recipients: NotificationRecipient[];
    channel: NotificationChannel;
    status: NotificationStatus;
  },
  db: NotificationDb,
): Promise<number> {
  await db.notification.createMany({
    data: input.recipients.map((recipient) => ({
      organizationId: input.organizationId,
      userId: recipient.userId,
      channel: input.channel,
      status: input.status,
      title: input.title,
      body: input.body,
      actionUrl: input.actionUrl ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      payload: {
        ...(input.payload ?? {}),
        eventType: input.eventType,
        actorUserId: input.actorUserId ?? null,
        channel: input.channel,
      },
    })),
  });

  await writeNotificationAudit({
    ...input,
    count: input.recipients.length,
    metadata: { eventType: input.eventType },
  }, db);

  return input.recipients.length;
}

async function createNotificationOutbox(
  input: NotificationDispatchInput & {
    recipients: NotificationRecipient[];
    channel: "EMAIL";
    outboxType: string;
  },
  db: NotificationDb,
): Promise<void> {
  await db.eventOutbox.create({
    data: {
      organizationId: input.organizationId,
      eventType: input.outboxType,
      payload: {
        eventType: input.eventType,
        channel: input.channel,
        provider: emailProviderStatus(),
        recipients: input.recipients.map((recipient) => ({
          userId: recipient.userId,
          email: recipient.email ?? null,
        })),
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        payload: toInputJsonObject(input.payload),
      } as Prisma.InputJsonObject,
    },
  });
}

async function queueWhatsAppPlaceholder(
  input: NotificationDispatchInput,
  db: NotificationDb,
): Promise<number> {
  const recipients = uniqueRecipients(input.recipients);
  if (recipients.length === 0) return 0;

  await db.eventOutbox.create({
    data: {
      organizationId: input.organizationId,
      eventType: "notification.whatsapp.placeholder",
      payload: {
        status: "placeholder",
        reason: "WhatsApp provider is not configured in the current Prisma schema.",
        eventType: input.eventType,
        recipients: recipients.map((recipient) => ({
          userId: recipient.userId,
          phone: recipient.phone ?? null,
        })),
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        payload: toInputJsonObject(input.payload),
      } as Prisma.InputJsonObject,
    },
  });
  await writeNotificationAudit({
    ...input,
    channel: "WEBHOOK",
    count: recipients.length,
    status: "PENDING",
    metadata: {
      provider: "whatsapp_placeholder",
      eventType: input.eventType,
      schemaChannel: "WEBHOOK",
    },
  }, db);

  return recipients.length;
}

async function writeNotificationAudit(
  input: NotificationDispatchInput & {
    channel: NotificationChannel;
    count: number;
    status: NotificationStatus;
    metadata?: Record<string, unknown>;
  },
  db: NotificationDb,
): Promise<void> {
  await writeAuditLog(
    {
      organizationId: input.organizationId,
      userId: input.actorUserId ?? null,
      action: `notification.${input.eventType}.${input.channel.toLowerCase()}`,
      resource: "notification",
      resourceId: input.entityId ?? null,
      severity: "INFO",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      after: {
        channel: input.channel,
        status: input.status,
        recipientCount: input.count,
        title: input.title,
      },
      metadata: {
        ...(input.metadata ?? {}),
        actionUrl: input.actionUrl ?? null,
        entityType: input.entityType ?? null,
      },
      correlationId: input.correlationId ?? input.entityId ?? undefined,
    },
    db,
  );
}

function uniqueRecipients(recipients: NotificationRecipient[]): NotificationRecipient[] {
  const map = new Map<string, NotificationRecipient>();
  for (const recipient of recipients) {
    if (recipient.userId && !map.has(recipient.userId)) {
      map.set(recipient.userId, recipient);
    }
  }
  return [...map.values()];
}

function emailProviderStatus(): string {
  return process.env.EMAIL_PROVIDER ?? "outbox_only";
}

function toInputJsonObject(value: Record<string, unknown> | undefined): Prisma.InputJsonObject {
  return (value ?? {}) as Prisma.InputJsonObject;
}
