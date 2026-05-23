import { formatEnvironmentReport, validateEnvironment } from "@/lib/env/validation";

let checked = false;

export function assertServerEnvironmentReady(): void {
  if (checked) return;
  checked = true;

  if (isNextBuildPhase()) {
    return;
  }

  const report = validateEnvironment();
  if (report.profile !== "production") {
    return;
  }

  if (!report.ok) {
    const message = `Production environment validation failed.\n${formatEnvironmentReport(report)}`;
    if (process.env.AI_ERP_ENFORCE_ENV_VALIDATION === "true") {
      throw new Error(message);
    }
    console.warn(message);
  }
}

assertServerEnvironmentReady();

function isNextBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build"
  );
}
