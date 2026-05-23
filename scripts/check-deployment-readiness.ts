import "dotenv/config";
import {
  formatEnvironmentReport,
  validateEnvironment,
  type EnvironmentProfile,
} from "../lib/env/validation";

const profile = profileFromArgs(process.argv.slice(2));
const report = validateEnvironment({ profile });

console.log(formatEnvironmentReport(report));

if (!report.ok) {
  process.exitCode = 1;
}

function profileFromArgs(args: string[]): EnvironmentProfile {
  const explicit = args.find((arg) => arg.startsWith("--profile="))?.split("=")[1];
  if (explicit === "development" || explicit === "demo" || explicit === "production") {
    return explicit;
  }

  if (process.env.AI_ERP_DEMO_MODE === "true") return "demo";
  return process.env.NODE_ENV === "production" ? "production" : "development";
}
