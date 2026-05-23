type EnvMap = Record<string, string | undefined>;

export type EnvironmentProfile = "development" | "demo" | "production";

export interface EnvironmentCheck {
  key: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export interface EnvironmentValidationReport {
  profile: EnvironmentProfile;
  ok: boolean;
  checks: EnvironmentCheck[];
  errors: EnvironmentCheck[];
  warnings: EnvironmentCheck[];
}

const requiredSecrets = [
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_MFA_CHALLENGE_SECRET",
] as const;

const placeholderPatterns = [
  "change-me",
  "changeme",
  "placeholder",
  "example",
  "secret-min-32-chars",
] as const;

const forbiddenPublicEnvFragments = [
  "SECRET",
  "TOKEN",
  "PASSWORD",
  "DATABASE",
  "PRIVATE",
  "KEY",
] as const;

export function validateEnvironment(params: {
  env?: EnvMap;
  profile?: EnvironmentProfile;
} = {}): EnvironmentValidationReport {
  const env = params.env ?? process.env;
  const profile = params.profile ?? profileFromEnv(env);
  const checks: EnvironmentCheck[] = [];

  checkRequired(checks, env, "DATABASE_URL");
  checkPostgresUrl(checks, env.DATABASE_URL, profile);
  checkRequired(checks, env, "PLATFORM_ORGANIZATION_SLUG");
  checkNumberRange(checks, env, "DATABASE_POOL_MAX", 1, 50, false);
  checkNumberRange(checks, env, "DB_HEALTHCHECK_TIMEOUT_MS", 500, 30_000, false);
  checkNumberRange(checks, env, "BCRYPT_ROUNDS", profile === "production" ? 12 : 10, 15, false);
  checkNumberRange(checks, env, "MAX_FAILED_LOGINS", 3, 20, false);
  checkNumberRange(checks, env, "LOCKOUT_WINDOW_MINUTES", 5, 240, false);
  checkNumberRange(checks, env, "LOCKOUT_DURATION_MINUTES", 5, 1_440, false);
  checkNumberRange(checks, env, "API_RATE_LIMIT_READS_PER_MINUTE", 60, 2_000, false);
  checkNumberRange(checks, env, "API_RATE_LIMIT_WRITES_PER_MINUTE", 20, 600, false);
  checkNumberRange(checks, env, "API_RATE_LIMIT_AUTH_PER_MINUTE", 5, 120, false);
  checkPublicEnvironmentExposure(checks, env, profile);

  for (const key of requiredSecrets) {
    checkRequired(checks, env, key);
    checkSecretStrength(checks, env, key, profile);
  }

  if (
    env.JWT_ACCESS_SECRET &&
    env.JWT_REFRESH_SECRET &&
    env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET
  ) {
    checks.push({
      key: "JWT_REFRESH_SECRET",
      status: profile === "production" ? "fail" : "warn",
      message: "Refresh token secret should be different from the access token secret.",
    });
  }

  if (
    env.JWT_ACCESS_SECRET &&
    env.JWT_MFA_CHALLENGE_SECRET &&
    env.JWT_ACCESS_SECRET === env.JWT_MFA_CHALLENGE_SECRET &&
    profile === "production"
  ) {
    checks.push({
      key: "JWT_MFA_CHALLENGE_SECRET",
      status: "fail",
      message: "MFA challenge secret must be unique in production.",
    });
  }

  if (env.SEED_ADMIN_PASSWORD === "ChangeMe@123" && profile === "production") {
    checks.push({
      key: "SEED_ADMIN_PASSWORD",
      status: "fail",
      message: "Default seed password is not allowed for production readiness.",
    });
  }

  if (env.AI_ERP_DEMO_MODE === "true" && profile === "production") {
    checks.push({
      key: "AI_ERP_DEMO_MODE",
      status: "fail",
      message: "Demo mode must be disabled for production deployments.",
    });
  }

  if (env.AI_ERP_SANDBOX_MODE === "true" && profile === "production") {
    checks.push({
      key: "AI_ERP_SANDBOX_MODE",
      status: "fail",
      message: "Sandbox mode must be disabled for production deployments.",
    });
  }

  if (env.NEXT_PUBLIC_AI_ERP_DEMO_MODE === "true" && profile === "production") {
    checks.push({
      key: "NEXT_PUBLIC_AI_ERP_DEMO_MODE",
      status: "fail",
      message: "Public demo banner flag must be disabled for production deployments.",
    });
  }

  if (
    profile === "production" &&
    env.NEXT_PUBLIC_AI_ERP_ENV &&
    env.NEXT_PUBLIC_AI_ERP_ENV !== "production"
  ) {
    checks.push({
      key: "NEXT_PUBLIC_AI_ERP_ENV",
      status: "fail",
      message: "Public environment label must be production for production deployments.",
    });
  }

  if (profile !== "production" && env.SEED_ADMIN_PASSWORD === "ChangeMe@123") {
    checks.push({
      key: "SEED_ADMIN_PASSWORD",
      status: "warn",
      message: "Default demo seed password is acceptable only for local demo environments.",
    });
  }

  const errors = checks.filter((check) => check.status === "fail");
  const warnings = checks.filter((check) => check.status === "warn");

  return {
    profile,
    ok: errors.length === 0,
    checks,
    errors,
    warnings,
  };
}

export function formatEnvironmentReport(report: EnvironmentValidationReport): string {
  const lines = [
    `Environment profile: ${report.profile}`,
    `Status: ${report.ok ? "ready" : "blocked"}`,
    "",
    ...report.checks.map((check) => {
      const marker =
        check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
      return `[${marker}] ${check.key}: ${check.message}`;
    }),
  ];

  return lines.join("\n");
}

function profileFromEnv(env: EnvMap): EnvironmentProfile {
  if (env.AI_ERP_DEMO_MODE === "true" || env.NEXT_PUBLIC_AI_ERP_DEMO_MODE === "true") {
    return "demo";
  }
  return env.NODE_ENV === "production" ? "production" : "development";
}

function checkRequired(checks: EnvironmentCheck[], env: EnvMap, key: string) {
  checks.push({
    key,
    status: env[key] ? "pass" : "fail",
    message: env[key] ? "Configured." : "Missing required environment variable.",
  });
}

function checkPostgresUrl(
  checks: EnvironmentCheck[],
  value: string | undefined,
  profile: EnvironmentProfile,
) {
  if (!value) return;

  try {
    const url = new URL(value);
    const protocolOk = url.protocol === "postgresql:" || url.protocol === "postgres:";
    const sslMode = url.searchParams.get("sslmode");
    checks.push({
      key: "DATABASE_URL",
      status: protocolOk ? "pass" : "fail",
      message: protocolOk ? "PostgreSQL connection URL detected." : "DATABASE_URL must be PostgreSQL.",
    });
    if (protocolOk && !sslMode && profile === "production") {
      checks.push({
        key: "DATABASE_URL",
        status: "warn",
        message: "Consider configuring sslmode for production database transport.",
      });
    }
  } catch {
    checks.push({
      key: "DATABASE_URL",
      status: "fail",
      message: "DATABASE_URL is not a valid URL.",
    });
  }
}

function checkSecretStrength(
  checks: EnvironmentCheck[],
  env: EnvMap,
  key: string,
  profile: EnvironmentProfile,
) {
  const value = env[key];
  if (!value) return;

  const weak = value.length < 32;
  const placeholder = placeholderPatterns.some((pattern) =>
    value.toLowerCase().includes(pattern),
  );

  if (weak || placeholder) {
    checks.push({
      key,
      status: profile === "production" ? "fail" : "warn",
      message: weak
        ? "Secret should be at least 32 characters."
        : "Secret appears to use a placeholder value.",
    });
    return;
  }

  checks.push({
    key,
    status: "pass",
    message: "Secret length and value look deployable.",
  });
}

function checkPublicEnvironmentExposure(
  checks: EnvironmentCheck[],
  env: EnvMap,
  profile: EnvironmentProfile,
) {
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith("NEXT_PUBLIC_") || !value) continue;
    const exposesSensitiveName = forbiddenPublicEnvFragments.some((fragment) =>
      key.includes(fragment),
    );
    if (!exposesSensitiveName) continue;

    checks.push({
      key,
      status: profile === "production" ? "fail" : "warn",
      message: "Public environment variables are bundled into browser code; do not expose secrets.",
    });
  }
}

function checkNumberRange(
  checks: EnvironmentCheck[],
  env: EnvMap,
  key: string,
  min: number,
  max: number,
  required: boolean,
) {
  const raw = env[key];
  if (!raw) {
    if (required) {
      checks.push({
        key,
        status: "fail",
        message: `Missing required numeric value between ${min} and ${max}.`,
      });
    }
    return;
  }

  const value = Number(raw);
  const ok = Number.isInteger(value) && value >= min && value <= max;
  checks.push({
    key,
    status: ok ? "pass" : "fail",
    message: ok ? `Value ${value} is within range.` : `Expected integer between ${min} and ${max}.`,
  });
}
