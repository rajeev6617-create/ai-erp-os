-- Existing department codes were optional in the legacy hierarchy model.
-- The ERP foundation master requires a code for every department.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "departments" WHERE "code" IS NULL) THEN
    RAISE EXCEPTION 'Cannot require department code: legacy department records with null codes still exist';
  END IF;
END $$;

ALTER TABLE "departments"
ALTER COLUMN "code" SET NOT NULL;
