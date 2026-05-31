import { prisma } from "@/lib/db/prisma";
import type { DocumentsDashboardData } from "@/lib/documents/types";

export async function getDocumentsDashboard(
  organizationId: string,
): Promise<DocumentsDashboardData> {
  const documents = await prisma.document.findMany({
    where: { organizationId, deletedAt: null },
    include: { folder: { select: { path: true, name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 24,
  });

  const totalBytes = documents.reduce((sum, doc) => sum + Number(doc.sizeBytes), 0);

  return {
    stats: [
      {
        label: "Active documents",
        value: String(documents.filter((d) => d.status === "ACTIVE").length),
        change: `${documents.length} total in library`,
        trend: "neutral",
      },
      {
        label: "Storage used",
        value: formatBytes(totalBytes),
        change: "Tenant-scoped evidence store",
        trend: "neutral",
      },
      {
        label: "Compliance tagged",
        value: String(documents.filter((d) => d.tags.some((t) => t.includes("compliance"))).length),
        change: "Audit-ready references",
        trend: "up",
      },
      {
        label: "Folders",
        value: String(new Set(documents.map((d) => d.folderId).filter(Boolean)).size),
        change: "Organized hierarchy",
        trend: "neutral",
      },
    ],
    documents: documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      sizeLabel: formatBytes(Number(doc.sizeBytes)),
      folderPath: doc.folder?.path ?? "/",
      tags: doc.tags,
      status: doc.status,
      visibility: doc.visibility,
      updatedAt: doc.updatedAt.toISOString(),
    })),
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
