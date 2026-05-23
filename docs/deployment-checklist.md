# AI ERP OS Deployment Checklist

Use this checklist before promoting a tenant build beyond local demo or sandbox environments.

## Environment Readiness

- Run `npm run check:env -- --profile=production`.
- Run `npm run audit:routes` to confirm dashboard pages map to explicit RBAC policies.
- Ensure `DATABASE_URL` points to the production PostgreSQL database.
- Set unique values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_MFA_CHALLENGE_SECRET`.
- Keep all JWT secrets at least 32 characters and avoid placeholder values.
- Set `DATABASE_POOL_MAX` according to the database plan.
- Use `BCRYPT_ROUNDS=12` or higher for production.
- Set API rate limits for read, write, and auth endpoints.
- Disable `AI_ERP_DEMO_MODE`, `AI_ERP_SANDBOX_MODE`, and `NEXT_PUBLIC_AI_ERP_DEMO_MODE`.
- Set `AI_ERP_ENFORCE_ENV_VALIDATION=true` for production runtime boot checks.
- Replace `SEED_ADMIN_PASSWORD` before running any seed in shared environments.

## Database

- Run `npm run db:generate` after schema changes.
- Run `npx prisma migrate deploy` against the target database.
- Confirm `/api/health/db` returns a successful database health response.
- Confirm migrations include finance, vendor, and enterprise configuration tables.
- Seed only approved demo or bootstrap tenants.
- Never run demo seed against production customer data.

## Demo And Sandbox Packaging

- Enable `AI_ERP_DEMO_MODE=true` and `AI_ERP_SANDBOX_MODE=true` only for local or sales demo environments.
- Set `NEXT_PUBLIC_AI_ERP_DEMO_TENANT` to the displayed sandbox tenant name.
- Confirm the dashboard banner appears in demo/sandbox mode.
- Verify demo walkthrough data exists in `organization_configurations` under `demo.walkthrough`.
- Confirm external actions remain placeholder-backed unless real providers are configured.

## Verification

- Run `npx tsc --noEmit`.
- Run `npm run lint`.
- Run `npm run build`.
- Smoke test:
  - `/login`
  - `/dashboard`
  - `/dashboard/finance`
  - `/dashboard/approvals`
  - `/dashboard/settings`
  - `/api/settings/configuration`
- Export a workflow MIS and finance MIS from the dashboard.
- Send one approval reminder in sandbox mode and confirm audit logs are created.

## Operational Review

- Confirm role access for organization admin, CFO, finance manager, auditor, and employee personas.
- Confirm finance KPIs are populated from invoices, payments, expenses, budgets, and vendors.
- Confirm empty states are readable when a tenant has no seeded operational data.
- Confirm error boundaries show a retry action and digest for support triage.
- Store deployment notes, environment profile, migration version, and smoke-test outcome in the release record.
