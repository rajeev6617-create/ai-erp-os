import { z } from "zod";

export const approvalTabSchema = z.enum(["pending", "rejected", "completed"]);

export const approvalActionSchema = z.object({
  action: z.enum(["approve", "reject", "escalate", "request_clarification"]),
  comment: z.string().max(2000).optional(),
});
