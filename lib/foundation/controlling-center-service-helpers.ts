import type { Prisma } from "@/app/generated/prisma/client";
import { NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import type {
  ControllingCompanyOption,
  ControllingDepartmentOption,
  ControllingLocationOption,
  ControllingUserOption,
} from "@/lib/foundation/controlling-center";

export type ControllingCenterMutationActor = {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  route?: string;
};

export async function listControllingCompanyOptions(
  organizationId: string,
): Promise<ControllingCompanyOption[]> {
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

export async function listControllingLocationOptions(
  organizationId: string,
): Promise<ControllingLocationOption[]> {
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

export async function listControllingDepartmentOptions(
  organizationId: string,
): Promise<ControllingDepartmentOption[]> {
  return prisma.department.findMany({
    where: { organizationId },
    select: {
      id: true,
      companyId: true,
      locationId: true,
      departmentCode: true,
      departmentName: true,
      status: true,
    },
    orderBy: { departmentCode: "asc" },
  });
}

export async function listControllingUserOptions(
  organizationId: string,
): Promise<ControllingUserOption[]> {
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

export async function assertActiveTenantCompany(
  tx: Prisma.TransactionClient,
  organizationId: string,
  companyId: string,
  errorCode: string,
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
      errorCode,
    );
  }
}

export async function assertTenantLocation(
  tx: Prisma.TransactionClient,
  organizationId: string,
  companyId: string,
  locationId: string | undefined,
  errorCode: string,
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
      errorCode,
    );
  }
}

export async function assertTenantDepartment(
  tx: Prisma.TransactionClient,
  organizationId: string,
  companyId: string,
  departmentId: string | undefined,
  errorCode: string,
) {
  if (!departmentId) return;

  const department = await tx.department.findFirst({
    where: {
      id: departmentId,
      organizationId,
      companyId,
      status: "ACTIVE",
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!department) {
    throw new NotFoundError(
      "Select an active department belonging to the chosen company",
      errorCode,
    );
  }
}

export async function assertTenantResponsibleUser(
  tx: Prisma.TransactionClient,
  organizationId: string,
  responsibleUserId: string | undefined,
  errorCode: string,
) {
  if (!responsibleUserId) return;

  const member = await tx.organizationMember.findFirst({
    where: {
      organizationId,
      userId: responsibleUserId,
      deletedAt: null,
      user: { deletedAt: null },
    },
    select: { id: true },
  });
  if (!member) {
    throw new NotFoundError(
      "Select a responsible user from this organization",
      errorCode,
    );
  }
}

export function toDatabaseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function userName(user: {
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
