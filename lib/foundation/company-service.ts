import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { writeAuditLog } from "@/lib/auth/audit";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import {
  type CompanyCreateInput,
  type CompanyListQueryInput,
  type CompanyRecord,
  type CompanyUpdateInput,
  companyCreateSchema,
  companyUpdateSchema,
  formatDateForInput,
  parseDateInput,
} from "@/lib/foundation/company";

const companySelect = {
  id: true,
  organizationId: true,
  companyCode: true,
  companyName: true,
  legalName: true,
  cin: true,
  gstin: true,
  pan: true,
  registeredAddress: true,
  country: true,
  state: true,
  city: true,
  currency: true,
  fiscalYearStart: true,
  fiscalYearEnd: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.CompanySelect;

type SelectedCompany = Prisma.CompanyGetPayload<{ select: typeof companySelect }>;

export type CompanyMutationActor = {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  route?: string;
};

export async function listCompanies(params: {
  organizationId: string;
  query?: CompanyListQueryInput;
}): Promise<CompanyRecord[]> {
  const where: Prisma.CompanyWhereInput = {
    organizationId: params.organizationId,
  };

  if (params.query?.status) {
    where.status = params.query.status;
  }

  if (params.query?.q) {
    const q = params.query.q;
    where.OR = [
      { companyCode: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { legalName: { contains: q, mode: "insensitive" } },
      { gstin: { contains: q, mode: "insensitive" } },
      { pan: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
    ];
  }

  const companies = await prisma.company.findMany({
    where,
    select: companySelect,
    orderBy: [{ companyCode: "asc" }, { createdAt: "desc" }],
  });

  return companies.map(mapCompanyRecord);
}

export async function getCompanyById(params: {
  organizationId: string;
  id: string;
}): Promise<CompanyRecord> {
  const company = await prisma.company.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: companySelect,
  });
  if (!company) {
    throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
  }
  return mapCompanyRecord(company);
}

export async function createCompany(params: {
  organizationId: string;
  input: CompanyCreateInput;
  actor: CompanyMutationActor;
}): Promise<CompanyRecord> {
  const input = companyCreateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.company.findFirst({
      where: {
        organizationId: params.organizationId,
        companyCode: input.companyCode,
      },
      select: { id: true },
    });
    if (duplicate) {
      throw new ConflictError(
        `Company code '${input.companyCode}' already exists for this organization`,
        "COMPANY_CODE_EXISTS",
      );
    }

    const created = await tx.company.create({
      data: {
        organizationId: params.organizationId,
        companyCode: input.companyCode,
        companyName: input.companyName,
        legalName: input.legalName,
        cin: input.cin ?? null,
        gstin: input.gstin ?? null,
        pan: input.pan ?? null,
        registeredAddress: input.registeredAddress,
        country: input.country,
        state: input.state,
        city: input.city,
        currency: input.currency,
        fiscalYearStart: parseDateInput(input.fiscalYearStart),
        fiscalYearEnd: parseDateInput(input.fiscalYearEnd),
        status: input.status,
        deletedAt: input.status === "INACTIVE" ? new Date() : null,
      },
      select: companySelect,
    });

    await writeAuditLog(
      {
        organizationId: params.organizationId,
        userId: params.actor.userId,
        action: "company.create",
        resource: "company",
        resourceId: created.id,
        severity: "INFO",
        ipAddress: params.actor.ipAddress ?? null,
        userAgent: params.actor.userAgent ?? null,
        after: toAuditSnapshot(created),
        metadata: {
          route: params.actor.route ?? "/api/foundation/company",
          source: "foundation.company",
        },
      },
      tx,
    );

    return mapCompanyRecord(created);
  });
}

export async function updateCompany(params: {
  organizationId: string;
  id: string;
  input: CompanyUpdateInput;
  actor: CompanyMutationActor;
}): Promise<CompanyRecord> {
  const input = companyUpdateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.company.findFirst({
      where: {
        id: params.id,
        organizationId: params.organizationId,
      },
      select: companySelect,
    });

    if (!existing) {
      throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
    }

    if (input.companyCode && input.companyCode !== existing.companyCode) {
      const duplicate = await tx.company.findFirst({
        where: {
          organizationId: params.organizationId,
          companyCode: input.companyCode,
          id: { not: params.id },
        },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictError(
          `Company code '${input.companyCode}' already exists for this organization`,
          "COMPANY_CODE_EXISTS",
        );
      }
    }

    const nextStatus = input.status ?? existing.status;
    const updateData: Prisma.CompanyUpdateInput = {};

    if ("companyCode" in input) updateData.companyCode = input.companyCode;
    if ("companyName" in input) updateData.companyName = input.companyName;
    if ("legalName" in input) updateData.legalName = input.legalName;
    if ("cin" in input) updateData.cin = input.cin ?? null;
    if ("gstin" in input) updateData.gstin = input.gstin ?? null;
    if ("pan" in input) updateData.pan = input.pan ?? null;
    if ("registeredAddress" in input) {
      updateData.registeredAddress = input.registeredAddress;
    }
    if ("country" in input) updateData.country = input.country;
    if ("state" in input) updateData.state = input.state;
    if ("city" in input) updateData.city = input.city;
    if ("currency" in input) updateData.currency = input.currency;
    if ("fiscalYearStart" in input && input.fiscalYearStart) {
      updateData.fiscalYearStart = parseDateInput(input.fiscalYearStart);
    }
    if ("fiscalYearEnd" in input && input.fiscalYearEnd) {
      updateData.fiscalYearEnd = parseDateInput(input.fiscalYearEnd);
    }
    if ("status" in input) {
      updateData.status = nextStatus;
      updateData.deletedAt =
        nextStatus === "INACTIVE"
          ? existing.deletedAt ?? new Date()
          : null;
    }

    const updated = await tx.company.update({
      where: { id: existing.id },
      data: updateData,
      select: companySelect,
    });

    await writeAuditLog(
      {
        organizationId: params.organizationId,
        userId: params.actor.userId,
        action: "company.update",
        resource: "company",
        resourceId: updated.id,
        severity: "INFO",
        ipAddress: params.actor.ipAddress ?? null,
        userAgent: params.actor.userAgent ?? null,
        before: toAuditSnapshot(existing),
        after: toAuditSnapshot(updated),
        metadata: {
          route: params.actor.route ?? `/api/foundation/company/${updated.id}`,
          source: "foundation.company",
        },
      },
      tx,
    );

    return mapCompanyRecord(updated);
  });
}

export async function deactivateCompany(params: {
  organizationId: string;
  id: string;
  actor: CompanyMutationActor;
}): Promise<CompanyRecord> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.company.findFirst({
      where: {
        id: params.id,
        organizationId: params.organizationId,
      },
      select: companySelect,
    });

    if (!existing) {
      throw new NotFoundError("Company not found", "COMPANY_NOT_FOUND");
    }

    const updated = await tx.company.update({
      where: { id: existing.id },
      data: {
        status: "INACTIVE",
        deletedAt: existing.deletedAt ?? new Date(),
      },
      select: companySelect,
    });

    await writeAuditLog(
      {
        organizationId: params.organizationId,
        userId: params.actor.userId,
        action: "company.deactivate",
        resource: "company",
        resourceId: updated.id,
        severity: "INFO",
        ipAddress: params.actor.ipAddress ?? null,
        userAgent: params.actor.userAgent ?? null,
        before: toAuditSnapshot(existing),
        after: toAuditSnapshot(updated),
        metadata: {
          route: params.actor.route ?? `/api/foundation/company/${updated.id}`,
          source: "foundation.company",
        },
      },
      tx,
    );

    return mapCompanyRecord(updated);
  });
}

function mapCompanyRecord(company: SelectedCompany): CompanyRecord {
  return {
    id: company.id,
    organizationId: company.organizationId,
    companyCode: company.companyCode,
    companyName: company.companyName,
    legalName: company.legalName,
    cin: company.cin,
    gstin: company.gstin,
    pan: company.pan,
    registeredAddress: company.registeredAddress,
    country: company.country,
    state: company.state,
    city: company.city,
    currency: company.currency,
    fiscalYearStart: formatDateForInput(company.fiscalYearStart),
    fiscalYearEnd: formatDateForInput(company.fiscalYearEnd),
    status: company.status,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
    deletedAt: company.deletedAt?.toISOString() ?? null,
  };
}

function toAuditSnapshot(company: SelectedCompany) {
  return {
    id: company.id,
    organizationId: company.organizationId,
    companyCode: company.companyCode,
    companyName: company.companyName,
    legalName: company.legalName,
    cin: company.cin,
    gstin: company.gstin,
    pan: company.pan,
    registeredAddress: company.registeredAddress,
    country: company.country,
    state: company.state,
    city: company.city,
    currency: company.currency,
    fiscalYearStart: formatDateForInput(company.fiscalYearStart),
    fiscalYearEnd: formatDateForInput(company.fiscalYearEnd),
    status: company.status,
    deletedAt: company.deletedAt?.toISOString() ?? null,
  };
}
