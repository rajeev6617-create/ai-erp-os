function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export const authConfig = {
  accessTokenSecret: requireEnv("JWT_ACCESS_SECRET"),
  refreshTokenSecret: requireEnv("JWT_REFRESH_SECRET"),
  mfaChallengeSecret: requireEnv(
    "JWT_MFA_CHALLENGE_SECRET",
    process.env.JWT_ACCESS_SECRET,
  ),
  accessTokenTtl: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
  refreshTokenTtl: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  mfaChallengeTtl: process.env.JWT_MFA_CHALLENGE_EXPIRES_IN ?? "5m",
  platformOrgSlug: process.env.PLATFORM_ORGANIZATION_SLUG ?? "platform",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 12),
  maxFailedLogins: Number(process.env.MAX_FAILED_LOGINS ?? 5),
  lockoutWindowMinutes: Number(process.env.LOCKOUT_WINDOW_MINUTES ?? 15),
  lockoutDurationMinutes: Number(process.env.LOCKOUT_DURATION_MINUTES ?? 30),
} as const;
