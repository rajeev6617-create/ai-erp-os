import type { Prisma } from "@/app/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";
import {
  type DepartmentCompanyOption,
  type DepartmentCreateInput,
  type DepartmentHeadUserOption,
  type DepartmentListQueryInput,
  type DepartmentLocationOption,
  type DepartmentParentOption,
  type DepartmentRecord,
  type DepartmentUpdateInput,
  departmentCreateSchema,
  departmentUpdateSchema,
} from "@/lib/foundation/department";

const departmentSelect = {
  id: true,
  organizationId: true,
  companyId: true,
  locationId: true,
  departmentCode: true,
  departmentName: true,
  departmentType: true,
  parentDepartmentId: true,
  departmentHeadUserId: true,
  costCenterCode: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  company: {
    select: {
      companyCode: true,
      companyName: true,
    },
  },
  location: {
    select: {
      locationCode: true,
      locationName: true,
    },
  },
  parent: {
    select: {
      departmentCode: true,
      departmentName: true,
    },
  },
  departmentHead: {
    select: {
      email: true,
      displayName: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.DepartmentSelect;

type SelectedDepartment = Prisma.DepartmentGetPayload<{
  select: typeof departmentSelect;
}>;

export type DepartmentMutationActor = {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  route?: string;
};

export async function listDepartmentCompanyOptions(
  organizationId: string,
): Promise<DepartmentCompanyOption[]> {
  return prisma.company.findMany({
    where: { organizationId },
    select: {
      id: true,
      companyCode: true,
      companyName: true,
      status: true,
    },
    orderBy: { companyCode: "asc" },
  });
}

export async function listDepartmentLocationOptions(
  organizationId: string,
): Promise<DepartmentLocationOption[]> {
  return prisma.location.findMany({
    where: { organizationId },
    select: {
      id: true,
      companyId: true,
      locationCode: true,
      locationName: true,
      status: true,
    },
    orderBy: { locationCode: "asc" },
  });
}

export async function listDepartmentParentOptions(
  organizationId: string,
): Promise<DepartmentParentOption[]> {
  return prisma.department.findMany({
    where: { organizationId },
    select: {
      id: true,
      companyId: true,
      departmentCode: true,
      departmentName: true,
      status: true,
    },
    orderBy: { departmentCode: "asc" },
  });
}

export async function listDepartmentHeadUserOptions(
  organizationId: string,
): Promise<DepartmentHeadUserOption[]> {
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId,
      deletedAt: null,
      user: { deletedAt: null },
    },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return members
    .map(({ user }) => ({
      id: user.id,
      email: user.email,
      name: userName(user),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function listDepartments(params: {
  organizationId: string;
  query?: DepartmentListQueryInput;
}): Promise<DepartmentRecord[]> {
  const where: Prisma.DepartmentWhereInput = {
    organizationId: params.organizationId,
  };

  if (params.query?.status) where.status = params.query.status;
  if (params.query?.departmentType) {
    where.departmentType = params.query.departmentType;
  }
  if (params.query?.companyId) where.companyId = params.query.companyId;
  if (params.query?.locationId) where.locationId = params.query.locationId;

  if (params.query?.q) {
    const q = params.query.q;
    where.OR = [
      { departmentCode: { contains: q, mode: "insensitive" } },
      { departmentName: { contains: q, mode: "insensitive" } },
      { costCenterCode: { contains: q, mode: "insensitive" } },
      { company: { companyCode: { contains: q, mode: "insensitive" } } },
      { company: { companyName: { contains: q, mode: "insensitive" } } },
      { location: { locationCode: { contains: q, mode: "insensitive" } } },
      { location: { locationName: { contains: q, mode: "insensitive" } } },
    ];
  }

  const departments = await prisma.department.findMany({
    where,
    select: departmentSelect,
    orderBy: [{ departmentCode: "asc" }, { createdAt: "desc" }],
  });

  return departments.map(mapDepartmentRecord);
}

export async function getDepartmentById(params: {
  organizationId: string;
  id: string;
}): Promise<DepartmentRecord> {
  const department = await prisma.department.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: departmentSelect,
  });
  if (!department) {
    throw new NotFoundError("Department not found", "DEPARTMENT_NOT_FOUND");
  }
  return mapDepartmentRecord(department);
}

export async function createDepartment(params: {
  organizationId: string;
  input: DepartmentCreateInput;
  actor: DepartmentMutationActor;
}): Promise<DepartmentRecord> {
  const input = departmentCreateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    await assertActiveTenantCompany(tx, params.organizationId, input.companyId);
    await assertDepartmentCodeAvailable(
      tx,
      params.organizationId,
      input.departmentCode,
    );
    await assertTenantLocation(
      tx,
      params.organizationId,
      input.companyId,
      input.locationId,
    );
    await assertValidParentDepartment(
      tx,
      params.organizationId,
      input.companyId,
      input.parentDepartmentId,
    );
    await assertTenantHeadUser(
      tx,
      params.organizationId,
      input.departmentHeadUserId,
    );

    const created = await tx.department.create({
      data: {
        organizationId: params.organizationId,
        companyId: input.companyId,
        locationId: input.locationId ?? null,
        departmentCode: input.departmentCode,
        departmentName: input.departmentName,
        departmentType: input.departmentType,
        parentDepartmentId: input.parentDepartmentId ?? null,
        departmentHeadUserId: input.departmentHeadUserId ?? null,
        costCenterCode: input.costCenterCode ?? null,
        status: input.status,
        deletedAt: input.status === "INACTIVE" ? new Date() : null,
      },
      select: departmentSelect,
    });

    await writeDepartmentAudit(tx, params, "department.create", created, null);
    return mapDepartmentRecord(created);
  });
}

export async function updateDepartment(params: {
  organizationId: string;
  id: string;
  input: DepartmentUpdateInput;
  actor: DepartmentMutationActor;
}): Promise<DepartmentRecord> {
  const input = departmentUpdateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    const existing = await findTenantDepartment(tx, params.organizationId, params.id);
    const merged = departmentCreateSchema.parse({
      companyId: input.companyId ?? existing.companyId,
      locationId:
        "locationId" in input ? input.locationId : existing.locationId ?? undefined,
      departmentCode: input.departmentCode ?? existing.departmentCode,
      departmentName: input.departmentName ?? existing.departmentName,
      departmentType: input.departmentType ?? existing.departmentType,
      parentDepartmentId:
        "parentDepartmentId" in input
          ? input.parentDepartmentId
          : existing.parentDepartmentId ?? undefined,
      departmentHeadUserId:
        "departmentHeadUserId" in input
          ? input.departmentHeadUserId
          : existing.departmentHeadUserId ?? undefined,
      costCenterCode:
        "costCenterCode" in input
          ? input.costCenterCode
          : existing.costCenterCode ?? undefined,
      status: input.status ?? existing.status,
    });

    const companyChanged = merged.companyId !== existing.companyId;
    if (companyChanged) {
      await assertActiveTenantCompany(tx, params.organizationId, merged.companyId);
    }
    if (merged.departmentCode !== existing.departmentCode) {
      await assertDepartmentCodeAvailable(
        tx,
        params.organizationId,
        merged.departmentCode,
        existing.id,
      );
    }
    if (companyChanged || merged.locationId !== (existing.locationId ?? undefined)) {
      await assertTenantLocation(
        tx,
        params.organizationId,
        merged.companyId,
        merged.locationId,
      );
    }
    if (
      companyChanged ||
      merged.parentDepartmentId !== (existing.parentDepartmentId ?? undefined)
    ) {
      await assertValidParentDepartment(
        tx,
        params.organizationId,
        merged.companyId,
        merged.parentDepartmentId,
        existing.id,
      );
    }
    if (
      merged.departmentHeadUserId !==
      (existing.departmentHeadUserId ?? undefined)
    ) {
      await assertTenantHeadUser(
        tx,
        params.organizationId,
        merged.departmentHeadUserId,
      );
    }

    const updated = await tx.department.update({
      where: { id: existing.id },
      data: {
        companyId: merged.companyId,
        locationId: merged.locationId ?? null,
        departmentCode: merged.departmentCode,
        departmentName: merged.departmentName,
        departmentType: merged.departmentType,
        parentDepartmentId: merged.parentDepartmentId ?? null,
        departmentHeadUserId: merged.departmentHeadUserId ?? null,
        costCenterCode: merged.costCenterCode ?? null,
        status: merged.status,
        deletedAt:
          merged.status === "INACTIVE"
            ? existing.deletedAt ?? new Date()
            : null,
      },
      select: departmentSelect,
    });

    await writeDepartmentAudit(tx, params, "department.update", updated, existing);
    return mapDepartmentRecord(updated);
  });
}

export async function deactivateDepartment(params: {
  organizationId: string;
  id: string;
  actor: DepartmentMutationActor;
}): Promise<DepartmentRecord> {
  return prisma.$transaction(async (tx) => {
    const existing = await findTenantDepartment(tx, params.organizationId, params.id);
    const updated = await tx.department.update({
      where: { id: existing.id },
      data: {
        status: "INACTIVE",
        deletedAt: existing.deletedAt ?? new Date(),
      },
      select: departmentSelect,
    });

    await writeDepartmentAudit(
      tx,
      params,
      "department.deactivate",
      updated,
      existing,
    );
    return mapDepartmentRecord(updated);
  });
}

async function findTenantDepartment(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
): Promise<SelectedDepartment> {
  const department = await tx.department.findFirst({
    where: { id, organizationId },
    select: departmentSelect,
  });
  if (!department) {
    throw new NotFoundError("Department not found", "DEPARTMENT_NOT_FOUND");
  }
  return department;
}

async function assertActiveTenantCompany(
  tx: Prisma.TransactionClient,
  organizationId: string,
  companyId: string,
) {
  const company = await tx.company.findFirst({
    where: {
      id: companyId,
      organizationId,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!company) {
    throw new NotFoundError(
      "Select an active company from this organization",
      "DEPARTMENT_COMPANY_NOT_FOUND",
    );
  }
}

async function assertDepartmentCodeAvailable(
  tx: Prisma.TransactionClient,
  organizationId: string,
  departmentCode: string,
  excludeId?: string,
) {
  const duplicate = await tx.department.findFirst({
    where: {
      organizationId,
      departmentCode,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ConflictError(
      `Department code '${departmentCode}' already exists for this organization`,
      "DEPARTMENT_CODE_EXISTS",
    );
  }
}

async function assertTenantLocation(
  tx: Prisma.TransactionClient,
  organizationId: string,
  companyId: string,
  locationId?: string,
) {
  if (!locationId) return;

  const location = await tx.location.findFirst({
    where: {
      id: locationId,
      organizationId,
      companyId,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!location) {
    throw new NotFoundError(
      "Select an active location belonging to the chosen company",
      "DEPARTMENT_LOCATION_NOT_FOUND",
    );
  }
}

async function assertValidParentDepartment(
  tx: Prisma.TransactionClient,
  organizationId: string,
  companyId: string,
  parentDepartmentId?: string,
  departmentId?: string,
) {
  if (!parentDepartmentId) return;

  const visited = new Set<string>();
  let currentId: string | null = parentDepartmentId;
  while (currentId) {
    if (currentId === departmentId || visited.has(currentId)) {
      throw new ConflictError(
        "A department cannot be its own parent or create a hierarchy cycle",
        "DEPARTMENT_PARENT_CYCLE",
      );
    }
    visited.add(currentId);

    const parent: {
      companyId: string;
      parentDepartmentId: string | null;
    } | null = await tx.department.findFirst({
      where: {
        id: currentId,
        organizationId,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: {
        companyId: true,
        parentDepartmentId: true,
      },
    });
    if (!parent || parent.companyId !== companyId) {
      throw new NotFoundError(
        "Select an active parent department from the chosen company",
        "DEPARTMENT_PARENT_NOT_FOUND",
      );
    }
    currentId = parent.parentDepartmentId;
  }
}

async function assertTenantHeadUser(
  tx: Prisma.TransactionClient,
  organizationId: string,
  departmentHeadUserId?: string,
) {
  if (!departmentHeadUserId) return;

  const member = await tx.organizationMember.findFirst({
    where: {
      organizationId,
      userId: departmentHeadUserId,
      deletedAt: null,
      user: { deletedAt: null },
    },
    select: { id: true },
  });
  if (!member) {
    throw new NotFoundError(
      "Select a department head from this organization",
      "DEPARTMENT_HEAD_NOT_FOUND",
    );
  }
}

async function writeDepartmentAudit(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actor: DepartmentMutationActor;
  },
  action: string,
  department: SelectedDepartment,
  before: SelectedDepartment | null,
) {
  await writeAuditLog(
    {
      organizationId: params.organizationId,
      userId: params.actor.userId,
      action,
      resource: "department",
      resourceId: department.id,
      severity: "INFO",
      ipAddress: params.actor.ipAddress ?? null,
      userAgent: params.actor.userAgent ?? null,
      before: before ? toAuditSnapshot(before) : undefined,
      after: toAuditSnapshot(department),
      metadata: {
        route:
          params.actor.route ?? `/api/foundation/departments/${department.id}`,
        source: "foundation.department",
      },
    },
    tx,
  );
}

function mapDepartmentRecord(department: SelectedDepartment): DepartmentRecord {
  return {
    id: department.id,
    organizationId: department.organizationId,
    companyId: department.companyId,
    companyCode: department.company.companyCode,
    companyName: department.company.companyName,
    locationId: department.locationId,
    locationCode: department.location?.locationCode ?? null,
    locationName: department.location?.locationName ?? null,
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    departmentType: department.departmentType,
    parentDepartmentId: department.parentDepartmentId,
    parentDepartmentCode: department.parent?.departmentCode ?? null,
    parentDepartmentName: department.parent?.departmentName ?? null,
    departmentHeadUserId: department.departmentHeadUserId,
    departmentHeadName: department.departmentHead
      ? userName(department.departmentHead)
      : null,
    departmentHeadEmail: department.departmentHead?.email ?? null,
    costCenterCode: department.costCenterCode,
    status: department.status,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
    deletedAt: department.deletedAt?.toISOString() ?? null,
  };
}

function toAuditSnapshot(department: SelectedDepartment) {
  return {
    id: department.id,
    organizationId: department.organizationId,
    companyId: department.companyId,
    companyCode: department.company.companyCode,
    locationId: department.locationId,
    locationCode: department.location?.locationCode ?? null,
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    departmentType: department.departmentType,
    parentDepartmentId: department.parentDepartmentId,
    departmentHeadUserId: department.departmentHeadUserId,
    costCenterCode: department.costCenterCode,
    status: department.status,
    deletedAt: department.deletedAt?.toISOString() ?? null,
  };
}

function userName(user: {
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}) {
  return (
    user.displayName ??
    ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email)
  );
}
