-- Add login attempt tracking for authentication lockout and audit safety.
-- Forward-only and idempotent so production deploys do not drop or reset data.
CREATE TABLE IF NOT EXISTS "login_attempts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organizationId" TEXT,
    "userId" TEXT,
    "ipAddress" VARCHAR(45),
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "login_attempts_email_createdAt_idx"
    ON "login_attempts"("email", "createdAt");

CREATE INDEX IF NOT EXISTS "login_attempts_ipAddress_createdAt_idx"
    ON "login_attempts"("ipAddress", "createdAt");

CREATE INDEX IF NOT EXISTS "login_attempts_organizationId_createdAt_idx"
    ON "login_attempts"("organizationId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'login_attempts_organizationId_fkey'
    ) THEN
        ALTER TABLE "login_attempts"
            ADD CONSTRAINT "login_attempts_organizationId_fkey"
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;
