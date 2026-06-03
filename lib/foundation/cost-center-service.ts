import type { Prisma } from "@/app/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";
import {
  type CostCenterCreateInput,
  type CostCenterListQueryInput,
  type CostCenterRecord,
  type CostCenterUpdateInput,
  costCenterCreateSchema,
  costCenterUpdateSchema,
} from "@/lib/foundation/controlling-center";
import {
  type ControllingCenterMutationActor,
  assertActiveTenantCompany,
  assertTenantDepartment,
  assertTenantLocation,
  assertTenantResponsibleUser,
  toDatabaseDate,
  toDateOnly,
  userName,
} from "@/lib/foundation/controlling-center-service-helpers";

const costCenterSelect = {
  id: true,
  organizationId: true,
  companyId: true,
  locationId: true,
  departmentId: true,
  costCenterCode: true,
  costCenterName: true,
  costCenterType: true,
  responsibleUserId: true,
  validFrom: true,
  validTo: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  company: { select: { companyCode: true, companyName: true } },
  location: { select: { locationCode: true, locationName: true } },
  department: { select: { departmentCode: true, departmentName: true } },
  responsibleUser: {
    select: {
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.CostCenterSelect;

type SelectedCostCenter = Prisma.CostCenterGetPayload<{
  select: typeof costCenterSelect;
}>;

export async function listCostCenters(params: {
  organizationId: string;
  query?: CostCenterListQueryInput;
}): Promise<CostCenterRecord[]> {
  const where: Prisma.CostCenterWhereInput = {
    organizationId: params.organizationId,
  };

  if (params.query?.status) where.status = params.query.status;
  if (params.query?.costCenterType) {
    where.costCenterType = params.query.costCenterType;
  }
  if (params.query?.companyId) where.companyId = params.query.companyId;
  if (params.query?.locationId) where.locationId = params.query.locationId;
  if (params.query?.departmentId) where.departmentId = params.query.departmentId;

  if (params.query?.q) {
    const q = params.query.q;
    where.OR = [
      { costCenterCode: { contains: q, mode: "insensitive" } },
      { costCenterName: { contains: q, mode: "insensitive" } },
      { company: { companyCode: { contains: q, mode: "insensitive" } } },
      { company: { companyName: { contains: q, mode: "insensitive" } } },
      { location: { locationCode: { contains: q, mode: "insensitive" } } },
      { location: { locationName: { contains: q, mode: "insensitive" } } },
      { department: { departmentCode: { contains: q, mode: "insensitive" } } },
      { department: { departmentName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const costCenters = await prisma.costCenter.findMany({
    where,
    select: costCenterSelect,
    orderBy: [{ costCenterCode: "asc" }, { createdAt: "desc" }],
  });

  return costCenters.map(mapCostCenterRecord);
}

export async function getCostCenterById(params: {
  organizationId: string;
  id: string;
}): Promise<CostCenterRecord> {
  const costCenter = await prisma.costCenter.findFirst({
    where: { id: params.id, organizationId: params.organizationId },
    select: costCenterSelect,
  });
  if (!costCenter) {
    throw new NotFoundError("Cost center not found", "COST_CENTER_NOT_FOUND");
  }
  return mapCostCenterRecord(costCenter);
}

export async function createCostCenter(params: {
  organizationId: string;
  input: CostCenterCreateInput;
  actor: ControllingCenterMutationActor;
}): Promise<CostCenterRecord> {
  const input = costCenterCreateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    await assertActiveTenantCompany(
      tx,
      params.organizationId,
      input.companyId,
      "COST_CENTER_COMPANY_NOT_FOUND",
    );
    await assertCostCenterCodeAvailable(
      tx,
      params.organizationId,
      input.costCenterCode,
    );
    await assertTenantLocation(
      tx,
      params.organizationId,
      input.companyId,
      input.locationId,
      "COST_CENTER_LOCATION_NOT_FOUND",
    );
    await assertTenantDepartment(
      tx,
      params.organizationId,
      input.companyId,
      input.departmentId,
      "COST_CENTER_DEPARTMENT_NOT_FOUND",
    );
    await assertTenantResponsibleUser(
      tx,
      params.organizationId,
      input.responsibleUserId,
      "COST_CENTER_RESPONSIBLE_USER_NOT_FOUND",
    );

    const created = await tx.costCenter.create({
      data: {
        organizationId: params.organizationId,
        companyId: input.companyId,
        locationId: input.locationId ?? null,
        departmentId: input.departmentId ?? null,
        costCenterCode: input.costCenterCode,
        costCenterName: input.costCenterName,
        costCenterType: input.costCenterType,
        responsibleUserId: input.responsibleUserId ?? null,
        validFrom: toDatabaseDate(input.validFrom),
        validTo: input.validTo ? toDatabaseDate(input.validTo) : null,
        status: input.status,
        deletedAt: input.status === "INACTIVE" ? new Date() : null,
      },
      select: costCenterSelect,
    });

    await writeCostCenterAudit(tx, params, "cost_center.create", created, null);
    return mapCostCenterRecord(created);
  });
}

export async function updateCostCenter(params: {
  organizationId: string;
  id: string;
  input: CostCenterUpdateInput;
  actor: ControllingCenterMutationActor;
}): Promise<CostCenterRecord> {
  const input = costCenterUpdateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    const existing = await findTenantCostCenter(tx, params.organizationId, params.id);
    const merged = costCenterCreateSchema.parse({
      companyId: input.companyId ?? existing.companyId,
      locationId:
        "locationId" in input ? input.locationId : existing.locationId ?? undefined,
      departmentId:
        "departmentId" in input
          ? input.departmentId
          : existing.departmentId ?? undefined,
      costCenterCode: input.costCenterCode ?? existing.costCenterCode,
      costCenterName: input.costCenterName ?? existing.costCenterName,
      costCenterType: input.costCenterType ?? existing.costCenterType,
      responsibleUserId:
        "responsibleUserId" in input
          ? input.responsibleUserId
          : existing.responsibleUserId ?? undefined,
      validFrom: input.validFrom ?? toDateOnly(existing.validFrom),
      validTo: "validTo" in input ? input.validTo : existing.validTo ? toDateOnly(existing.validTo) : undefined,
      status: input.status ?? existing.status,
    });

    const companyChanged = merged.companyId !== existing.companyId;
    if (companyChanged) {
      await assertActiveTenantCompany(
        tx,
        params.organizationId,
        merged.companyId,
        "COST_CENTER_COMPANY_NOT_FOUND",
      );
    }
    if (merged.costCenterCode !== existing.costCenterCode) {
      await assertCostCenterCodeAvailable(
        tx,
        params.organizationId,
        merged.costCenterCode,
        existing.id,
      );
    }
    if (companyChanged || merged.locationId !== (existing.locationId ?? undefined)) {
      await assertTenantLocation(
        tx,
        params.organizationId,
        merged.companyId,
        merged.locationId,
        "COST_CENTER_LOCATION_NOT_FOUND",
      );
    }
    if (
      companyChanged ||
      merged.departmentId !== (existing.departmentId ?? undefined)
    ) {
      await assertTenantDepartment(
        tx,
        params.organizationId,
        merged.companyId,
        merged.departmentId,
        "COST_CENTER_DEPARTMENT_NOT_FOUND",
      );
    }
    if (
      merged.responsibleUserId !== (existing.responsibleUserId ?? undefined)
    ) {
      await assertTenantResponsibleUser(
        tx,
        params.organizationId,
        merged.responsibleUserId,
        "COST_CENTER_RESPONSIBLE_USER_NOT_FOUND",
      );
    }

    const updated = await tx.costCenter.update({
      where: { id: existing.id },
      data: {
        companyId: merged.companyId,
        locationId: merged.locationId ?? null,
        departmentId: merged.departmentId ?? null,
        costCenterCode: merged.costCenterCode,
        costCenterName: merged.costCenterName,
        costCenterType: merged.costCenterType,
        responsibleUserId: merged.responsibleUserId ?? null,
        validFrom: toDatabaseDate(merged.validFrom),
        validTo: merged.validTo ? toDatabaseDate(merged.validTo) : null,
        status: merged.status,
        deletedAt:
          merged.status === "INACTIVE" ? existing.deletedAt ?? new Date() : null,
      },
      select: costCenterSelect,
    });

    await writeCostCenterAudit(tx, params, "cost_center.update", updated, existing);
    return mapCostCenterRecord(updated);
  });
}

export async function deactivateCostCenter(params: {
  organizationId: string;
  id: string;
  actor: ControllingCenterMutationActor;
}): Promise<CostCenterRecord> {
  return prisma.$transaction(async (tx) => {
    const existing = await findTenantCostCenter(tx, params.organizationId, params.id);
    const updated = await tx.costCenter.update({
      where: { id: existing.id },
      data: { status: "INACTIVE", deletedAt: existing.deletedAt ?? new Date() },
      select: costCenterSelect,
    });
    await writeCostCenterAudit(
      tx,
      params,
      "cost_center.deactivate",
      updated,
      existing,
    );
    return mapCostCenterRecord(updated);
  });
}

async function findTenantCostCenter(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
): Promise<SelectedCostCenter> {
  const costCenter = await tx.costCenter.findFirst({
    where: { id, organizationId },
    select: costCenterSelect,
  });
  if (!costCenter) {
    throw new NotFoundError("Cost center not found", "COST_CENTER_NOT_FOUND");
  }
  return costCenter;
}

async function assertCostCenterCodeAvailable(
  tx: Prisma.TransactionClient,
  organizationId: string,
  costCenterCode: string,
  excludeId?: string,
) {
  const duplicate = await tx.costCenter.findFirst({
    where: {
      organizationId,
      costCenterCode,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ConflictError(
      `Cost center code '${costCenterCode}' already exists for this organization`,
      "COST_CENTER_CODE_EXISTS",
    );
  }
}

async function writeCostCenterAudit(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actor: ControllingCenterMutationActor;
  },
  action: string,
  costCenter: SelectedCostCenter,
  before: SelectedCostCenter | null,
) {
  await writeAuditLog(
    {
      organizationId: params.organizationId,
      userId: params.actor.userId,
      action,
      resource: "cost_center",
      resourceId: costCenter.id,
      severity: "INFO",
      ipAddress: params.actor.ipAddress ?? null,
      userAgent: params.actor.userAgent ?? null,
      before: before ? toAuditSnapshot(before) : undefined,
      after: toAuditSnapshot(costCenter),
      metadata: {
        route:
          params.actor.route ?? `/api/foundation/cost-centers/${costCenter.id}`,
        source: "foundation.cost_center",
      },
    },
    tx,
  );
}

function mapCostCenterRecord(costCenter: SelectedCostCenter): CostCenterRecord {
  return {
    id: costCenter.id,
    organizationId: costCenter.organizationId,
    companyId: costCenter.companyId,
    companyCode: costCenter.company.companyCode,
    companyName: costCenter.company.companyName,
    locationId: costCenter.locationId,
    locationCode: costCenter.location?.locationCode ?? null,
    locationName: costCenter.location?.locationName ?? null,
    departmentId: costCenter.departmentId,
    departmentCode: costCenter.department?.departmentCode ?? null,
    departmentName: costCenter.department?.departmentName ?? null,
    costCenterCode: costCenter.costCenterCode,
    costCenterName: costCenter.costCenterName,
    costCenterType: costCenter.costCenterType,
    responsibleUserId: costCenter.responsibleUserId,
    responsibleUserName: costCenter.responsibleUser
      ? userName(costCenter.responsibleUser)
      : null,
    responsibleUserEmail: costCenter.responsibleUser?.email ?? null,
    validFrom: toDateOnly(costCenter.validFrom),
    validTo: costCenter.validTo ? toDateOnly(costCenter.validTo) : null,
    status: costCenter.status,
    createdAt: costCenter.createdAt.toISOString(),
    updatedAt: costCenter.updatedAt.toISOString(),
    deletedAt: costCenter.deletedAt?.toISOString() ?? null,
  };
}

function toAuditSnapshot(costCenter: SelectedCostCenter) {
  return {
    id: costCenter.id,
    organizationId: costCenter.organizationId,
    companyId: costCenter.companyId,
    companyCode: costCenter.company.companyCode,
    locationId: costCenter.locationId,
    locationCode: costCenter.location?.locationCode ?? null,
    departmentId: costCenter.departmentId,
    departmentCode: costCenter.department?.departmentCode ?? null,
    costCenterCode: costCenter.costCenterCode,
    costCenterName: costCenter.costCenterName,
    costCenterType: costCenter.costCenterType,
    responsibleUserId: costCenter.responsibleUserId,
    validFrom: toDateOnly(costCenter.validFrom),
    validTo: costCenter.validTo ? toDateOnly(costCenter.validTo) : null,
    status: costCenter.status,
    deletedAt: costCenter.deletedAt?.toISOString() ?? null,
  };
}
