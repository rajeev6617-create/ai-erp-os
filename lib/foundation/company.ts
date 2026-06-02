import { z } from "zod";

export const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z]\dZ[A-Z0-9]$/;
export const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;
const COMPANY_CODE_REGEX = /^[A-Z0-9_-]+$/;
const CURRENCY_REGEX = /^[A-Z]{3}$/;

export const companyStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export type CompanyStatusValue = z.infer<typeof companyStatusSchema>;

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

function isValidDateInput(value: string): boolean {
  const date = toDateValue(value);
  return !Number.isNaN(date.getTime());
}

function toDateValue(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }
  return new Date(value);
}

const fiscalStartSchema = requiredText("Fiscal year start", 32).refine(
  isValidDateInput,
  "Fiscal year start must be a valid date",
);

const fiscalEndSchema = requiredText("Fiscal year end", 32).refine(
  isValidDateInput,
  "Fiscal year end must be a valid date",
);

const companyBaseObjectSchema = z.object({
  companyCode: requiredText("Company code", 20)
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => COMPANY_CODE_REGEX.test(value),
      "Company code may contain only letters, numbers, hyphen, and underscore",
    ),
  companyName: requiredText("Company name", 120),
  legalName: requiredText("Legal name", 200),
  cin: optionalText(21),
  gstin: optionalText(15)
    .transform((value) => value?.toUpperCase())
    .refine(
      (value) => !value || GSTIN_REGEX.test(value),
      "GSTIN format is invalid",
    ),
  pan: optionalText(10)
    .transform((value) => value?.toUpperCase())
    .refine(
      (value) => !value || PAN_REGEX.test(value),
      "PAN format is invalid",
    ),
  registeredAddress: requiredText("Registered address", 500),
  country: requiredText("Country", 100),
  state: requiredText("State", 100),
  city: requiredText("City", 100),
  currency: requiredText("Currency", 3)
    .transform((value) => value.toUpperCase())
    .refine((value) => CURRENCY_REGEX.test(value), "Currency must be a 3-letter ISO code"),
  fiscalYearStart: fiscalStartSchema,
  fiscalYearEnd: fiscalEndSchema,
  status: companyStatusSchema,
});

export const companyCreateSchema = companyBaseObjectSchema.superRefine((value, ctx) => {
    if (toDateValue(value.fiscalYearEnd) < toDateValue(value.fiscalYearStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fiscal year end must be on or after fiscal year start",
        path: ["fiscalYearEnd"],
      });
    }
  });

export const companyUpdateSchema = companyBaseObjectSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required for update",
  })
  .superRefine((value, ctx) => {
    const hasStart = typeof value.fiscalYearStart === "string";
    const hasEnd = typeof value.fiscalYearEnd === "string";
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Both fiscal year start and fiscal year end must be provided together",
        path: hasStart ? ["fiscalYearEnd"] : ["fiscalYearStart"],
      });
      return;
    }
    const start = hasStart ? value.fiscalYearStart : undefined;
    const end = hasEnd ? value.fiscalYearEnd : undefined;
    if (start && end && toDateValue(end) < toDateValue(start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Fiscal year end must be on or after fiscal year start",
        path: ["fiscalYearEnd"],
      });
    }
  });

export const companyListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  status: companyStatusSchema.optional(),
});

export type CompanyCreateInput = z.infer<typeof companyCreateSchema>;
export type CompanyUpdateInput = z.infer<typeof companyUpdateSchema>;
export type CompanyListQueryInput = z.infer<typeof companyListQuerySchema>;

export interface CompanyRecord {
  id: string;
  organizationId: string;
  companyCode: string;
  companyName: string;
  legalName: string;
  cin: string | null;
  gstin: string | null;
  pan: string | null;
  registeredAddress: string;
  country: string;
  state: string;
  city: string;
  currency: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  status: CompanyStatusValue;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export function parseDateInput(value: string): Date {
  return toDateValue(value);
}

export function formatDateForInput(value: Date): string {
  return value.toISOString().slice(0, 10);
}
