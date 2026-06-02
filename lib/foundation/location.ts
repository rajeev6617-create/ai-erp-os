import { z } from "zod";
import { GSTIN_REGEX } from "@/lib/foundation/company";

const LOCATION_CODE_REGEX = /^[A-Z0-9_-]+$/;
const INDIA_PINCODE_REGEX = /^[1-9]\d{5}$/;

export const locationTypeSchema = z.enum([
  "PLANT",
  "BRANCH",
  "OFFICE",
  "WAREHOUSE",
  "DEPOT",
]);
export const locationStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export type LocationTypeValue = z.infer<typeof locationTypeSchema>;
export type LocationStatusValue = z.infer<typeof locationStatusSchema>;

function requiredText(field: string, maxLength: number) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z
      .string()
      .min(1, `${field} is required`)
      .max(maxLength, `${field} must be at most ${maxLength} characters`),
  );
}

function optionalText(maxLength: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.string().max(maxLength).optional(),
  );
}

const locationBaseObjectSchema = z.object({
  companyId: requiredText("Company", 64),
  locationCode: requiredText("Location code", 30)
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => LOCATION_CODE_REGEX.test(value),
      "Location code may contain only letters, numbers, hyphen, and underscore",
    ),
  locationName: requiredText("Location name", 160),
  locationType: locationTypeSchema,
  gstRegistrationNumber: optionalText(15)
    .transform((value) => value?.toUpperCase())
    .refine(
      (value) => !value || GSTIN_REGEX.test(value),
      "GST registration number format is invalid",
    ),
  address: requiredText("Address", 500),
  country: requiredText("Country", 100),
  state: requiredText("State", 100),
  city: requiredText("City", 100),
  pincode: requiredText("Pincode", 20),
  contactPerson: optionalText(120),
  contactEmail: optionalText(254).refine(
    (value) => !value || z.email().safeParse(value).success,
    "Contact email format is invalid",
  ),
  contactPhone: optionalText(30),
  isPrimary: z.boolean(),
  status: locationStatusSchema,
});

function validateIndiaPincode(
  value: {
    country?: string;
    pincode?: string;
    isPrimary?: boolean;
    status?: LocationStatusValue;
  },
  ctx: z.RefinementCtx,
) {
  if (
    value.country?.toLowerCase() === "india" &&
    value.pincode &&
    !INDIA_PINCODE_REGEX.test(value.pincode)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "India pincode must be a valid 6-digit postal code",
      path: ["pincode"],
    });
  }
  if (value.isPrimary && value.status === "INACTIVE") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "An inactive location cannot be the primary location",
      path: ["isPrimary"],
    });
  }
}

export const locationCreateSchema =
  locationBaseObjectSchema.superRefine(validateIndiaPincode);

export const locationUpdateSchema = locationBaseObjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  })
  .superRefine(validateIndiaPincode);

export const locationListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: locationStatusSchema.optional(),
  locationType: locationTypeSchema.optional(),
  companyId: z.string().trim().max(64).optional(),
});

export type LocationCreateInput = z.infer<typeof locationCreateSchema>;
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
export type LocationListQueryInput = z.infer<typeof locationListQuerySchema>;

export interface LocationCompanyOption {
  id: string;
  companyCode: string;
  companyName: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface LocationRecord {
  id: string;
  organizationId: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  locationCode: string;
  locationName: string;
  locationType: LocationTypeValue;
  gstRegistrationNumber: string | null;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isPrimary: boolean;
  status: LocationStatusValue;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
