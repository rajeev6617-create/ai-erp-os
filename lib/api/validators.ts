import { z } from "zod";
import { SYSTEM_ROLES, type SystemRoleSlug } from "@/lib/auth/constants";

const systemRoleEnum = z.enum(
  SYSTEM_ROLES as unknown as [SystemRoleSlug, ...SystemRoleSlug[]],
);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  organizationId: z.string().cuid().optional(),
  organizationSlug: z.string().min(1).max(64).optional(),
  mfaCode: z.string().min(6).max(12).optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(32).optional(),
});

export const validateRoleSchema = z.object({
  organizationId: z.string().cuid(),
  role: systemRoleEnum,
});

export const validatePermissionSchema = z.object({
  organizationId: z.string().cuid(),
  resource: z.string().min(1).max(64),
  action: z.string().min(1).max(32),
});
