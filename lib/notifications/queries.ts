import { prisma } from "@/lib/db/prisma";

export interface NotificationCenterItem {
  id: string;
  title: string;
  body: string | null;
  channel: string;
  status: string;
  actionUrl: string | null;
  entityType: string | null;
  entityId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationCenterData {
  unreadCount: number;
  items: NotificationCenterItem[];
}

export async function getNotificationCenter(params: {
  organizationId: string;
  userId: string;
  take?: number;
}): Promise<NotificationCenterData> {
  const take = Math.min(params.take ?? 20, 50);
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { organizationId: params.organizationId, userId: params.userId },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.notification.count({
      where: {
        organizationId: params.organizationId,
        userId: params.userId,
        readAt: null,
      },
    }),
  ]);

  return {
    unreadCount,
    items: items.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      channel: item.channel,
      status: item.status,
      actionUrl: item.actionUrl,
      entityType: item.entityType,
      entityId: item.entityId,
      createdAt: item.createdAt.toISOString(),
      readAt: item.readAt?.toISOString() ?? null,
    })),
  };
}

export async function markNotificationsRead(params: {
  organizationId: string;
  userId: string;
  notificationIds?: string[];
}): Promise<{ updated: number }> {
  const result = await prisma.notification.updateMany({
    where: {
      organizationId: params.organizationId,
      userId: params.userId,
      readAt: null,
      ...(params.notificationIds?.length ? { id: { in: params.notificationIds } } : {}),
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  return { updated: result.count };
}
