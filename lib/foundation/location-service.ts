import type { Prisma } from "@/app/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { writeAuditLog } from "@/lib/auth/audit";
import { prisma } from "@/lib/db/prisma";
import {
  type LocationCompanyOption,
  type LocationCreateInput,
  type LocationListQueryInput,
  type LocationRecord,
  type LocationUpdateInput,
  locationCreateSchema,
  locationUpdateSchema,
} from "@/lib/foundation/location";

const locationSelect = {
  id: true,
  organizationId: true,
  companyId: true,
  locationCode: true,
  locationName: true,
  locationType: true,
  gstRegistrationNumber: true,
  address: true,
  country: true,
  state: true,
  city: true,
  pincode: true,
  contactPerson: true,
  contactEmail: true,
  contactPhone: true,
  isPrimary: true,
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
} satisfies Prisma.LocationSelect;

type SelectedLocation = Prisma.LocationGetPayload<{ select: typeof locationSelect }>;

export type LocationMutationActor = {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  route?: string;
};

export async function listLocationCompanyOptions(
  organizationId: string,
): Promise<LocationCompanyOption[]> {
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

export async function listLocations(params: {
  organizationId: string;
  query?: LocationListQueryInput;
}): Promise<LocationRecord[]> {
  const where: Prisma.LocationWhereInput = {
    organizationId: params.organizationId,
  };

  if (params.query?.status) where.status = params.query.status;
  if (params.query?.locationType) where.locationType = params.query.locationType;
  if (params.query?.companyId) where.companyId = params.query.companyId;

  if (params.query?.q) {
    const q = params.query.q;
    where.OR = [
      { locationCode: { contains: q, mode: "insensitive" } },
      { locationName: { contains: q, mode: "insensitive" } },
      { gstRegistrationNumber: { contains: q, mode: "insensitive" } },
      { city: { contains: q, mode: "insensitive" } },
      { state: { contains: q, mode: "insensitive" } },
      { company: { companyName: { contains: q, mode: "insensitive" } } },
      { company: { companyCode: { contains: q, mode: "insensitive" } } },
    ];
  }

  const locations = await prisma.location.findMany({
    where,
    select: locationSelect,
    orderBy: [
      { isPrimary: "desc" },
      { locationCode: "asc" },
      { createdAt: "desc" },
    ],
  });

  return locations.map(mapLocationRecord);
}

export async function getLocationById(params: {
  organizationId: string;
  id: string;
}): Promise<LocationRecord> {
  const location = await prisma.location.findFirst({
    where: {
      id: params.id,
      organizationId: params.organizationId,
    },
    select: locationSelect,
  });
  if (!location) {
    throw new NotFoundError("Location not found", "LOCATION_NOT_FOUND");
  }
  return mapLocationRecord(location);
}

export async function createLocation(params: {
  organizationId: string;
  input: LocationCreateInput;
  actor: LocationMutationActor;
}): Promise<LocationRecord> {
  const input = locationCreateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    await assertActiveTenantCompany(tx, params.organizationId, input.companyId);
    await assertLocationCodeAvailable(tx, params.organizationId, input.locationCode);

    if (input.isPrimary) {
      await clearCompanyPrimaryLocation(tx, params.organizationId, input.companyId);
    }

    const created = await tx.location.create({
      data: {
        organizationId: params.organizationId,
        companyId: input.companyId,
        locationCode: input.locationCode,
        locationName: input.locationName,
        locationType: input.locationType,
        gstRegistrationNumber: input.gstRegistrationNumber ?? null,
        address: input.address,
        country: input.country,
        state: input.state,
        city: input.city,
        pincode: input.pincode,
        contactPerson: input.contactPerson ?? null,
        contactEmail: input.contactEmail ?? null,
        contactPhone: input.contactPhone ?? null,
        isPrimary: input.isPrimary,
        status: input.status,
        deletedAt: input.status === "INACTIVE" ? new Date() : null,
      },
      select: locationSelect,
    });

    await writeLocationAudit(tx, params, "location.create", created, null);
    return mapLocationRecord(created);
  });
}

export async function updateLocation(params: {
  organizationId: string;
  id: string;
  input: LocationUpdateInput;
  actor: LocationMutationActor;
}): Promise<LocationRecord> {
  const input = locationUpdateSchema.parse(params.input);

  return prisma.$transaction(async (tx) => {
    const existing = await findTenantLocation(tx, params.organizationId, params.id);
    const merged = locationCreateSchema.parse({
      companyId: input.companyId ?? existing.companyId,
      locationCode: input.locationCode ?? existing.locationCode,
      locationName: input.locationName ?? existing.locationName,
      locationType: input.locationType ?? existing.locationType,
      gstRegistrationNumber:
        "gstRegistrationNumber" in input
          ? input.gstRegistrationNumber
          : existing.gstRegistrationNumber ?? undefined,
      address: input.address ?? existing.address,
      country: input.country ?? existing.country,
      state: input.state ?? existing.state,
      city: input.city ?? existing.city,
      pincode: input.pincode ?? existing.pincode,
      contactPerson:
        "contactPerson" in input
          ? input.contactPerson
          : existing.contactPerson ?? undefined,
      contactEmail:
        "contactEmail" in input
          ? input.contactEmail
          : existing.contactEmail ?? undefined,
      contactPhone:
        "contactPhone" in input
          ? input.contactPhone
          : existing.contactPhone ?? undefined,
      isPrimary: input.isPrimary ?? existing.isPrimary,
      status: input.status ?? existing.status,
    });

    if (merged.companyId !== existing.companyId) {
      await assertActiveTenantCompany(tx, params.organizationId, merged.companyId);
    }
    if (merged.locationCode !== existing.locationCode) {
      await assertLocationCodeAvailable(
        tx,
        params.organizationId,
        merged.locationCode,
        existing.id,
      );
    }

    if (merged.isPrimary) {
      await clearCompanyPrimaryLocation(
        tx,
        params.organizationId,
        merged.companyId,
        existing.id,
      );
    }

    const updated = await tx.location.update({
      where: { id: existing.id },
      data: {
        companyId: merged.companyId,
        locationCode: merged.locationCode,
        locationName: merged.locationName,
        locationType: merged.locationType,
        gstRegistrationNumber: merged.gstRegistrationNumber ?? null,
        address: merged.address,
        country: merged.country,
        state: merged.state,
        city: merged.city,
        pincode: merged.pincode,
        contactPerson: merged.contactPerson ?? null,
        contactEmail: merged.contactEmail ?? null,
        contactPhone: merged.contactPhone ?? null,
        isPrimary: merged.isPrimary,
        status: merged.status,
        deletedAt:
          merged.status === "INACTIVE"
            ? existing.deletedAt ?? new Date()
            : null,
      },
      select: locationSelect,
    });

    await writeLocationAudit(tx, params, "location.update", updated, existing);
    return mapLocationRecord(updated);
  });
}

export async function deactivateLocation(params: {
  organizationId: string;
  id: string;
  actor: LocationMutationActor;
}): Promise<LocationRecord> {
  return prisma.$transaction(async (tx) => {
    const existing = await findTenantLocation(tx, params.organizationId, params.id);
    const updated = await tx.location.update({
      where: { id: existing.id },
      data: {
        isPrimary: false,
        status: "INACTIVE",
        deletedAt: existing.deletedAt ?? new Date(),
      },
      select: locationSelect,
    });

    await writeLocationAudit(tx, params, "location.deactivate", updated, existing);
    return mapLocationRecord(updated);
  });
}

async function findTenantLocation(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
): Promise<SelectedLocation> {
  const location = await tx.location.findFirst({
    where: { id, organizationId },
    select: locationSelect,
  });
  if (!location) {
    throw new NotFoundError("Location not found", "LOCATION_NOT_FOUND");
  }
  return location;
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
      "LOCATION_COMPANY_NOT_FOUND",
    );
  }
}

async function assertLocationCodeAvailable(
  tx: Prisma.TransactionClient,
  organizationId: string,
  locationCode: string,
  excludeId?: string,
) {
  const duplicate = await tx.location.findFirst({
    where: {
      organizationId,
      locationCode,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });
  if (duplicate) {
    throw new ConflictError(
      `Location code '${locationCode}' already exists for this organization`,
      "LOCATION_CODE_EXISTS",
    );
  }
}

async function clearCompanyPrimaryLocation(
  tx: Prisma.TransactionClient,
  organizationId: string,
  companyId: string,
  excludeId?: string,
) {
  await tx.location.updateMany({
    where: {
      organizationId,
      companyId,
      isPrimary: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    data: { isPrimary: false },
  });
}

async function writeLocationAudit(
  tx: Prisma.TransactionClient,
  params: {
    organizationId: string;
    actor: LocationMutationActor;
  },
  action: string,
  location: SelectedLocation,
  before: SelectedLocation | null,
) {
  await writeAuditLog(
    {
      organizationId: params.organizationId,
      userId: params.actor.userId,
      action,
      resource: "location",
      resourceId: location.id,
      severity: "INFO",
      ipAddress: params.actor.ipAddress ?? null,
      userAgent: params.actor.userAgent ?? null,
      before: before ? toAuditSnapshot(before) : undefined,
      after: toAuditSnapshot(location),
      metadata: {
        route: params.actor.route ?? `/api/foundation/locations/${location.id}`,
        source: "foundation.location",
      },
    },
    tx,
  );
}

function mapLocationRecord(location: SelectedLocation): LocationRecord {
  return {
    id: location.id,
    organizationId: location.organizationId,
    companyId: location.companyId,
    companyCode: location.company.companyCode,
    companyName: location.company.companyName,
    locationCode: location.locationCode,
    locationName: location.locationName,
    locationType: location.locationType,
    gstRegistrationNumber: location.gstRegistrationNumber,
    address: location.address,
    country: location.country,
    state: location.state,
    city: location.city,
    pincode: location.pincode,
    contactPerson: location.contactPerson,
    contactEmail: location.contactEmail,
    contactPhone: location.contactPhone,
    isPrimary: location.isPrimary,
    status: location.status,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
    deletedAt: location.deletedAt?.toISOString() ?? null,
  };
}

function toAuditSnapshot(location: SelectedLocation) {
  return {
    id: location.id,
    organizationId: location.organizationId,
    companyId: location.companyId,
    companyCode: location.company.companyCode,
    locationCode: location.locationCode,
    locationName: location.locationName,
    locationType: location.locationType,
    gstRegistrationNumber: location.gstRegistrationNumber,
    address: location.address,
    country: location.country,
    state: location.state,
    city: location.city,
    pincode: location.pincode,
    contactPerson: location.contactPerson,
    contactEmail: location.contactEmail,
    contactPhone: location.contactPhone,
    isPrimary: location.isPrimary,
    status: location.status,
    deletedAt: location.deletedAt?.toISOString() ?? null,
  };
}
