import { z } from "zod";

const DEPARTMENT_CODE_REGEX = /^[A-Z0-9_-]+$/;

export const departmentTypeSchema = z.enum([
  "FINANCE",
  "PURCHASE",
  "SALES",
  "STORES",
  "PRODUCTION",
  "QUALITY",
  "HR",
  "ADMIN",
  "IT",
  "MANAGEMENT",
  "OTHER",
]);
export const departmentStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export type DepartmentTypeValue = z.infer<typeof departmentTypeSchema>;
export type DepartmentStatusValue = z.infer<typeof departmentStatusSchema>;

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

const departmentBaseObjectSchema = z.object({
  companyId: requiredText("Company", 64),
  locationId: optionalText(64),
  departmentCode: requiredText("Department code", 30)
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => DEPARTMENT_CODE_REGEX.test(value),
      "Department code may contain only letters, numbers, hyphen, and underscore",
    ),
  departmentName: requiredText("Department name", 160),
  departmentType: departmentTypeSchema,
  parentDepartmentId: optionalText(64),
  departmentHeadUserId: optionalText(64),
  costCenterCode: optionalText(60),
  status: departmentStatusSchema,
});

export const departmentCreateSchema = departmentBaseObjectSchema;

export const departmentUpdateSchema = departmentBaseObjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  });

export const departmentListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: departmentStatusSchema.optional(),
  departmentType: departmentTypeSchema.optional(),
  companyId: z.string().trim().max(64).optional(),
  locationId: z.string().trim().max(64).optional(),
});

export type DepartmentCreateInput = z.infer<typeof departmentCreateSchema>;
export type DepartmentUpdateInput = z.infer<typeof departmentUpdateSchema>;
export type DepartmentListQueryInput = z.infer<typeof departmentListQuerySchema>;

export interface DepartmentCompanyOption {
  id: string;
  companyCode: string;
  companyName: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface DepartmentLocationOption {
  id: string;
  companyId: string;
  locationCode: string;
  locationName: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface DepartmentParentOption {
  id: string;
  companyId: string;
  departmentCode: string;
  departmentName: string;
  status: DepartmentStatusValue;
}

export interface DepartmentHeadUserOption {
  id: string;
  name: string;
  email: string;
}

export interface DepartmentRecord {
  id: string;
  organizationId: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  departmentCode: string;
  departmentName: string;
  departmentType: DepartmentTypeValue;
  parentDepartmentId: string | null;
  parentDepartmentCode: string | null;
  parentDepartmentName: string | null;
  departmentHeadUserId: string | null;
  departmentHeadName: string | null;
  departmentHeadEmail: string | null;
  costCenterCode: string | null;
  status: DepartmentStatusValue;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
