-- Bring user_sessions forward to the tenant-aware session model used by auth.
-- This is intentionally additive/backfilled so production data is preserved.
ALTER TABLE "user_sessions"
    ADD COLUMN IF NOT EXISTS "organizationId" TEXT,
    ADD COLUMN IF NOT EXISTS "accessTokenHash" TEXT,
    ADD COLUMN IF NOT EXISTS "refreshTokenHash" TEXT,
    ADD COLUMN IF NOT EXISTS "mfaVerified" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "refreshExpiresAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_sessions'
          AND column_name = 'tokenHash'
    ) THEN
        UPDATE "user_sessions"
        SET
            "accessTokenHash" = COALESCE("accessTokenHash", "tokenHash", "id"),
            "refreshTokenHash" = COALESCE("refreshTokenHash", "tokenHash", "id"),
            "refreshExpiresAt" = COALESCE("refreshExpiresAt", "expiresAt"),
            "lastActivityAt" = COALESCE("lastActivityAt", "updatedAt", "createdAt", CURRENT_TIMESTAMP);
    ELSE
        UPDATE "user_sessions"
        SET
            "accessTokenHash" = COALESCE("accessTokenHash", "id"),
            "refreshTokenHash" = COALESCE("refreshTokenHash", "id"),
            "refreshExpiresAt" = COALESCE("refreshExpiresAt", "expiresAt"),
            "lastActivityAt" = COALESCE("lastActivityAt", "updatedAt", "createdAt", CURRENT_TIMESTAMP);
    END IF;
END
$$;

ALTER TABLE "user_sessions"
    ALTER COLUMN "accessTokenHash" SET NOT NULL,
    ALTER COLUMN "refreshTokenHash" SET NOT NULL,
    ALTER COLUMN "refreshExpiresAt" SET NOT NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'user_sessions'
          AND column_name = 'tokenHash'
    ) THEN
        ALTER TABLE "user_sessions"
            ALTER COLUMN "tokenHash" DROP NOT NULL;
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_accessTokenHash_key"
    ON "user_sessions"("accessTokenHash");

CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_refreshTokenHash_key"
    ON "user_sessions"("refreshTokenHash");

CREATE INDEX IF NOT EXISTS "user_sessions_organizationId_userId_idx"
    ON "user_sessions"("organizationId", "userId");

CREATE INDEX IF NOT EXISTS "user_sessions_refreshTokenHash_idx"
    ON "user_sessions"("refreshTokenHash");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'user_sessions_organizationId_fkey'
    ) THEN
        ALTER TABLE "user_sessions"
            ADD CONSTRAINT "user_sessions_organizationId_fkey"
            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
