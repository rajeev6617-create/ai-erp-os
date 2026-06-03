import type { Prisma } from "@/app/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";
import {
  type ProfitCenterCreateInput,
  type ProfitCenterListQueryInput,
  type ProfitCenterRecord,
  type ProfitCenterUpdateInput,
  profitCenterCreateSchema,
  profitCenterUpdateSchema,
} from "@/lib/foundation/controlling-center";
import {
  type ControllingCenterMutationActor,
  assertActiveTenantCompany,
  assertTenantLocation,
  assertTenantResponsibleUser,
  toDatabaseDate,
  toDateOnly,
  userName,
} from "@/lib/foundation/controlling-center-service-helpers";

const profitCenterSelect = {
  id: true,
  organizationId: true,
  companyId: true,
  locationId: true,
  profitCenterCode: true,
  profitCenterName: true,
  businessSegment: true,
  responsibleUserId: true,
  validFrom: true,
  validTo: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  company: { select: { companyCode: true, companyName: true } },
  location: { select: { locationCode: true, locationName: true } },
  responsibleUser: {
    select: {
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.ProfitCenterSelect;

type SelectedProfitCenter = Prisma.ProfitCenterGetPayload<{
  select: typeof profitCenterSelect;
}>;

export async function listProfitCenters(params: {
  organizationId: string;
  query?: ProfitCenterListQueryInput;
}): Promise<ProfitCenterRecord[]> {
  const where: Prisma.ProfitCenterWhereInput = {
    organizationId: params.organizationId,
  };

  if (params.query?.status) where.status = params.query.status;
  if (params.query?.companyId) where.companyId = params.query.companyId;
  if (params.query?.locationId) where.locationId = params.query.locationId;

  if (params.query?.q) {
    const q = params.query.q;
    where.OR = [
      { profitCenterCode: { contains: q, mode: "insensitive" } },
      { profitCenterName: { contains: q, mode: "insensitive" } },
      { businessSegment: { contains: q, mode: "insensitive" } },
      { company: { companyCode: { contains: q, mode: "insensitive" } } },
      { company: { companyName: { contains: q, mode: "insensitive" } } },
      { location: { locationCode: { contains: q, mode: "insensitive" } } },
      { location: { locationName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const profitCenters = await prisma.profitCenter.findMany({
    where,
    select: profitCenterSelect,
    orderBy: [{ profitCenterCode: "asc" }, { createdAt: "desc" }],
  });

  return profitCenters.map(mapProfitCenterRecord);
}

export async function getProfitCenterById(params: {
  organizationId: string;
  id: string;
}): Promise<ProfitCenterRecord> {
  const profitCenter = await prisma.profitCenter.findFirst({
    where: { id: params.id, organizationId: params.organizationId },
    select: profitCenterSelect,
  });
  if (!profitCenter) {
    throw new NotFoundError(
      "Profit center not found",
      "PROFIT_CENTER_NOT_FOUND",
    );
  }
  return mapProfitCenterRecord(profitCenter);
}

export async function createProfitCenter(params: {
  organizationId: string;
  input: ProfitCenterCreateInput;
  actor: ControllingCenterMutationActor;
}): Promise<ProfitCenterRecord> {
  const input = profitCenterCreateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    await assertActiveTenantCompany(
      tx,
      params.organizationId,
      input.companyId,
      "PROFIT_CENTER_COMPANY_NOT_FOUND",
    );
    await assertProfitCenterCodeAvailable(
      tx,
      params.organizationId,
      input.profitCenterCode,
    );
    await assertTenantLocation(
      tx,
      params.organizationId,
      input.companyId,
      input.locationId,
      "PROFIT_CENTER_LOCATION_NOT_FOUND",
    );
    await assertTenantResponsibleUser(
      tx,
      params.organizationId,
      input.responsibleUserId,
      "PROFIT_CENTER_RESPONSIBLE_USER_NOT_FOUND",
    );

    const created = await tx.profitCenter.create({
      data: {
        organizationId: params.organizationId,
        companyId: input.companyId,
        locationId: input.locationId ?? null,
        profitCenterCode: input.profitCenterCode,
        profitCenterName: input.profitCenterName,
        businessSegment: input.businessSegment ?? null,
        responsibleUserId: input.responsibleUserId ?? null,
        validFrom: toDatabaseDate(input.validFrom),
        validTo: input.validTo ? toDatabaseDate(input.validTo) : null,
        status: input.status,
        deletedAt: input.status === "INACTIVE" ? new Date() : null,
      },
      select: profitCenterSelect,
    });

    await writeProfitCenterAudit(
      tx,
      params,
      "profit_center.create",
      created,
      null,
    );
    return mapProfitCenterRecord(created);
  });
}

export async function updateProfitCenter(params: {
  organizationId: string;
  id: string;
  input: ProfitCenterUpdateInput;
  actor: ControllingCenterMutationActor;
}): Promise<ProfitCenterRecord> {
  const input = profitCenterUpdateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    const existing = await findTenantProfitCenter(
      tx,
      params.organizationId,
      params.id,
    );
    const merged = profitCenterCreateSchema.parse({
      companyId: input.companyId ?? existing.companyId,
      locationId:
        "locationId" in input ? input.locationId : existing.locationId ?? undefined,
      profitCenterCode: input.profitCenterCode ?? existing.profitCenterCode,
      profitCenterName: input.profitCenterName ?? existing.profitCenterName,
      businessSegment:
        "businessSegment" in input
          ? input.businessSegment
          : existing.businessSegment ?? undefined,
      responsibleUserId:
        "responsibleUserId" in input
          ? input.responsibleUserId
          : existing.responsibleUserId ?? undefined,
      validFrom: input.validFrom ?? toDateOnly(existing.validFrom),
      validTo:
        "validTo" in input
          ? input.validTo
          : existing.validTo
            ? toDateOnly(existing.validTo)
            : undefined,
      status: input.status ?? existing.status,
    });

    const companyChanged = merged.companyId !== existing.companyId;
    if (companyChanged) {
      await assertActiveTenantCompany(
        tx,
        params.organizationId,
        merged.companyId,
        "PROFIT_CENTER_COMPANY_NOT_FOUND",
      );
    }
    if (merged.profitCenterCode !== existing.profitCenterCode) {
      await assertProfitCenterCodeAvailable(
        tx,
        params.organizationId,
        merged.profitCenterCode,
        existing.id,
      );
    }
    if (companyChanged || merged.locationId !== (existing.locationId ?? undefined)) {
      await assertTenantLocation(
        tx,
        params.organizationId,
        merged.companyId,
        merged.locationId,
        "PROFIT_CENTER_LOCATION_NOT_FOUND",
      );
    }
    if (
      merged.responsibleUserId !== (existing.responsibleUserId ?? undefined)
    ) {
      await assertTenantResponsibleUser(
        tx,
        params.organizationId,
        merged.responsibleUserId,
        "PROFIT_CENTER_RESPONSIBLE_USER_NOT_FOUND",
      );
    }

    const updated = await tx.profitCenter.update({
      where: { id: existing.id },
      data: {
        companyId: merged.companyId,
        locationId: merged.locationId ?? null,
        profitCenterCode: merged.profitCenterCode,
        profitCenterName: merged.profitCenterName,
        businessSegment: merged.businessSegment ?? null,
        responsibleUserId: merged.responsibleUserId ?? null,
        validFrom: toDatabaseDate(merged.validFrom),
        validTo: merged.validTo ? toDatabaseDate(merged.validTo) : null,
        status: merged.status,
        deletedAt:
          merged.status === "INACTIVE" ? existing.deletedAt ?? new Date() : null,
      },
      select: profitCenterSelect,
    });

    await writeProfitCenterAudit(
      tx,
      params,
      "profit_center.update",
      updated,
      existing,
    );
    return mapProfitCenterRecord(updated);
  });
}

export async function deactivateProfitCenter(params: {
  organizationId: string;
  id: string;
  actor: ControllingCenterMutationActor;
}): Promise<ProfitCenterRecord> {
  return prisma.$transaction(async (tx) => {
    const existing = await findTenantProfitCenter(
      tx,
      params.organizationId,
      params.id,
    );
    const updated = await tx.profitCenter.update({
      where: { id: existing.id },
      data: { status: "INACTIVE", deletedAt: existing.deletedAt ?? new Date() },
      select: profitCenterSelect,
    });
    await writeProfitCenterAudit(
      tx,
      params,
      "profit_center.deactivate",
      updated,
      existing,
    );
    return mapProfitCenterRecord(updated);
  });
}

async function findTenantProfitCenter(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
): Promise<SelectedProfitCenter> {
  const profitCenter = await tx.profitCenter.findFirst({
    where: { id, organizationId },
    select: profitCenterSelect,
  });
  if (!profitCenter) {
    throw new NotFoundError(
      "Profit center not found",
      "PROFIT_CENTER_NOT_FOUND",
    );
  }
  return profitCenter;
}

async function assertProfitCenterCodeAvailable(
  tx: Prisma.TransactionClient,
  organizationId: string,
  profitCenterCode: string,
  excludeId?: string,
) {
  const duplicate = await tx.profitCenter.findFirst({
    where: {
      organizationId,
      profitCenterCode,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ConflictError(
      `Profit center code '${profitCenterCode}' already exists for this organization`,
      "PROFIT_CENTER_CODE_EXISTS",
    );
  }
}

async function writeProfitCenterAudit(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actor: ControllingCenterMutationActor;
  },
  action: string,
  profitCenter: SelectedProfitCenter,
  before: SelectedProfitCenter | null,
) {
  await writeAuditLog(
    {
      organizationId: params.organizationId,
      userId: params.actor.userId,
      action,
      resource: "profit_center",
      resourceId: profitCenter.id,
      severity: "INFO",
      ipAddress: params.actor.ipAddress ?? null,
      userAgent: params.actor.userAgent ?? null,
      before: before ? toAuditSnapshot(before) : undefined,
      after: toAuditSnapshot(profitCenter),
      metadata: {
        route:
          params.actor.route ??
          `/api/foundation/profit-centers/${profitCenter.id}`,
        source: "foundation.profit_center",
      },
    },
    tx,
  );
}

function mapProfitCenterRecord(
  profitCenter: SelectedProfitCenter,
): ProfitCenterRecord {
  return {
    id: profitCenter.id,
    organizationId: profitCenter.organizationId,
    companyId: profitCenter.companyId,
    companyCode: profitCenter.company.companyCode,
    companyName: profitCenter.company.companyName,
    locationId: profitCenter.locationId,
    locationCode: profitCenter.location?.locationCode ?? null,
    locationName: profitCenter.location?.locationName ?? null,
    profitCenterCode: profitCenter.profitCenterCode,
    profitCenterName: profitCenter.profitCenterName,
    businessSegment: profitCenter.businessSegment,
    responsibleUserId: profitCenter.responsibleUserId,
    responsibleUserName: profitCenter.responsibleUser
      ? userName(profitCenter.responsibleUser)
      : null,
    responsibleUserEmail: profitCenter.responsibleUser?.email ?? null,
    validFrom: toDateOnly(profitCenter.validFrom),
    validTo: profitCenter.validTo ? toDateOnly(profitCenter.validTo) : null,
    status: profitCenter.status,
    createdAt: profitCenter.createdAt.toISOString(),
    updatedAt: profitCenter.updatedAt.toISOString(),
    deletedAt: profitCenter.deletedAt?.toISOString() ?? null,
  };
}

function toAuditSnapshot(profitCenter: SelectedProfitCenter) {
  return {
    id: profitCenter.id,
    organizationId: profitCenter.organizationId,
    companyId: profitCenter.companyId,
    companyCode: profitCenter.company.companyCode,
    locationId: profitCenter.locationId,
    locationCode: profitCenter.location?.locationCode ?? null,
    profitCenterCode: profitCenter.profitCenterCode,
    profitCenterName: profitCenter.profitCenterName,
    businessSegment: profitCenter.businessSegment,
    responsibleUserId: profitCenter.responsibleUserId,
    validFrom: toDateOnly(profitCenter.validFrom),
    validTo: profitCenter.validTo ? toDateOnly(profitCenter.validTo) : null,
    status: profitCenter.status,
    deletedAt: profitCenter.deletedAt?.toISOString() ?? null,
  };
}
