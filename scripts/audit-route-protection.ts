import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import {
  auditDashboardRouteProtection,
  DASHBOARD_ROUTE_POLICIES,
} from "../lib/auth/route-protection";

const dashboardRoot = join(process.cwd(), "app", "(dashboard)", "dashboard");
const dashboardPaths = findDashboardPages(dashboardRoot);
const audit = auditDashboardRouteProtection(dashboardPaths);
const failures = audit.filter((item) => item.status === "fail");

console.log("Dashboard route protection audit");
console.log(`Policies: ${DASHBOARD_ROUTE_POLICIES.length}`);

for (const item of audit) {
  const marker = item.status === "pass" ? "PASS" : "FAIL";
  console.log(`[${marker}] ${item.path}: ${item.message}`);
}

if (failures.length > 0) {
  process.exitCode = 1;
}

function findDashboardPages(root: string): string[] {
  const files = walk(root).filter((file) => file.endsWith(`${sep}page.tsx`));
  return files
    .map((file) => {
      const route = relative(root, file)
        .replace(/(^|[\\/])page\.tsx$/, "")
        .split(sep)
        .filter(Boolean)
        .join("/");
      return route ? `/dashboard/${route}` : "/dashboard";
    })
    .sort();
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    return stats.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
