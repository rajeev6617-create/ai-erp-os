import { withAuthJson } from "@/lib/middleware/with-auth";
import { prisma } from "@/lib/db/prisma";
import { mapExecutionToCard } from "@/lib/workflows/mappers";

export const GET = withAuthJson(async (_req, auth) => {
  const executions = await prisma.workflowExecution.findMany({
    where: { organizationId: auth.organization.id },
    include: {
      workflow: true,
      approvals: {
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              displayName: true,
            },
          },
          execution: { include: { workflow: true } },
          steps: {
            orderBy: { sequence: "asc" },
            include: {
              assignee: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return { items: executions.map((execution) => mapExecutionToCard(execution)) };
});
