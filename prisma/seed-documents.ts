import type { PrismaClient } from "../app/generated/prisma/client";

export async function seedDocumentsData(
  prisma: PrismaClient,
  organizationId: string,
  createdById: string,
) {
  const folder = await prisma.documentFolder.upsert({
    where: {
      organizationId_path: {
        organizationId,
        path: "/finance/compliance",
      },
    },
    create: {
      organizationId,
      name: "Finance & Compliance",
      path: "/finance/compliance",
      metadata: { seedProfile: "erp-documents" },
    },
    update: { name: "Finance & Compliance", deletedAt: null },
  });

  const docs = [
    {
      title: "GST filing checklist FY26",
      fileName: "gst-filing-checklist-fy26.pdf",
      mimeType: "application/pdf",
      sizeBytes: 245_760,
      tags: ["gst", "compliance"],
    },
    {
      title: "Vendor payment policy",
      fileName: "vendor-payment-policy.pdf",
      mimeType: "application/pdf",
      sizeBytes: 512_000,
      tags: ["finance", "policy"],
    },
    {
      title: "Board MIS template Q1",
      fileName: "board-mis-template-q1.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      sizeBytes: 98_304,
      tags: ["executive", "mis"],
    },
  ];

  for (const doc of docs) {
    const storageKey = `seed/${organizationId}/${doc.fileName}`;
    const existing = await prisma.document.findFirst({
      where: { organizationId, storageKey, deletedAt: null },
      select: { id: true },
    });
    if (existing) continue;

    await prisma.document.create({
      data: {
        organizationId,
        folderId: folder.id,
        createdById,
        title: doc.title,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        sizeBytes: BigInt(doc.sizeBytes),
        storageKey,
        status: "ACTIVE",
        visibility: "ORGANIZATION",
        tags: doc.tags,
        metadata: { seedProfile: "erp-documents" },
      },
    });
  }

  console.log("  Documents: finance/compliance folder with policy and MIS files");
}
