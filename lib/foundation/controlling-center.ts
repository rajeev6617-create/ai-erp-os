import { z } from "zod";

const CENTER_CODE_REGEX = /^[A-Z0-9_-]+$/;

export const controllingCenterStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const costCenterTypeSchema = z.enum([
  "ADMIN",
  "FINANCE",
  "PURCHASE",
  "SALES",
  "PRODUCTION",
  "QUALITY",
  "MAINTENANCE",
  "HR",
  "IT",
  "OTHER",
]);

export type ControllingCenterStatusValue = z.infer<
  typeof controllingCenterStatusSchema
>;
export type CostCenterTypeValue = z.infer<typeof costCenterTypeSchema>;

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

function centerCode(field: string) {
  return requiredText(field, 30)
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => CENTER_CODE_REGEX.test(value),
      `${field} may contain only letters, numbers, hyphen, and underscore`,
    );
}

const requiredDate = (field: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : value),
    z.iso.date({ message: `${field} must be a valid date` }),
  );

const optionalDate = (field: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? undefined : trimmed;
    },
    z.iso.date({ message: `${field} must be a valid date` }).optional(),
  );

function validateEffectiveDates(
  value: { validFrom?: string; validTo?: string },
  ctx: z.RefinementCtx,
) {
  if (value.validFrom && value.validTo && value.validTo < value.validFrom) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Valid to cannot be before valid from",
      path: ["validTo"],
    });
  }
}

const costCenterBaseObjectSchema = z.object({
  companyId: requiredText("Company", 64),
  locationId: optionalText(64),
  departmentId: optionalText(64),
  costCenterCode: centerCode("Cost center code"),
  costCenterName: requiredText("Cost center name", 160),
  costCenterType: costCenterTypeSchema,
  responsibleUserId: optionalText(64),
  validFrom: requiredDate("Valid from"),
  validTo: optionalDate("Valid to"),
  status: controllingCenterStatusSchema,
});

const profitCenterBaseObjectSchema = z.object({
  companyId: requiredText("Company", 64),
  locationId: optionalText(64),
  profitCenterCode: centerCode("Profit center code"),
  profitCenterName: requiredText("Profit center name", 160),
  businessSegment: optionalText(160),
  responsibleUserId: optionalText(64),
  validFrom: requiredDate("Valid from"),
  validTo: optionalDate("Valid to"),
  status: controllingCenterStatusSchema,
});

export const costCenterCreateSchema =
  costCenterBaseObjectSchema.superRefine(validateEffectiveDates);
export const costCenterUpdateSchema = costCenterBaseObjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  })
  .superRefine(validateEffectiveDates);

export const profitCenterCreateSchema =
  profitCenterBaseObjectSchema.superRefine(validateEffectiveDates);
export const profitCenterUpdateSchema = profitCenterBaseObjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  })
  .superRefine(validateEffectiveDates);

export const costCenterListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: controllingCenterStatusSchema.optional(),
  costCenterType: costCenterTypeSchema.optional(),
  companyId: z.string().trim().max(64).optional(),
  locationId: z.string().trim().max(64).optional(),
  departmentId: z.string().trim().max(64).optional(),
});

export const profitCenterListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: controllingCenterStatusSchema.optional(),
  companyId: z.string().trim().max(64).optional(),
  locationId: z.string().trim().max(64).optional(),
});

export type CostCenterCreateInput = z.infer<typeof costCenterCreateSchema>;
export type CostCenterUpdateInput = z.infer<typeof costCenterUpdateSchema>;
export type CostCenterListQueryInput = z.infer<typeof costCenterListQuerySchema>;
export type ProfitCenterCreateInput = z.infer<typeof profitCenterCreateSchema>;
export type ProfitCenterUpdateInput = z.infer<typeof profitCenterUpdateSchema>;
export type ProfitCenterListQueryInput = z.infer<
  typeof profitCenterListQuerySchema
>;

export interface ControllingCompanyOption {
  id: string;
  companyCode: string;
  companyName: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ControllingLocationOption {
  id: string;
  companyId: string;
  locationCode: string;
  locationName: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ControllingDepartmentOption {
  id: string;
  companyId: string;
  locationId: string | null;
  departmentCode: string;
  departmentName: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface ControllingUserOption {
  id: string;
  name: string;
  email: string;
}

export interface CostCenterRecord {
  id: string;
  organizationId: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  costCenterCode: string;
  costCenterName: string;
  costCenterType: CostCenterTypeValue;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  responsibleUserEmail: string | null;
  validFrom: string;
  validTo: string | null;
  status: ControllingCenterStatusValue;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ProfitCenterRecord {
  id: string;
  organizationId: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  profitCenterCode: string;
  profitCenterName: string;
  businessSegment: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  responsibleUserEmail: string | null;
  validFrom: string;
  validTo: string | null;
  status: ControllingCenterStatusValue;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
