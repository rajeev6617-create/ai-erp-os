ASTRA is the AI operating system for modern enterprises: a multi-tenant Next.js enterprise dashboard with RBAC, workflow approvals, finance intelligence, reporting, and tenant configuration.

## Getting Started

First, copy `.env.example` to `.env`, update the database URL and secrets, then run:

```bash
npm run db:generate
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Demo users are printed by `npm run db:seed`. The default local demo password is controlled by `SEED_ADMIN_PASSWORD`.

## Readiness

```bash
npm run check:env -- --profile=demo
npm run check:env -- --profile=production
npm run lint
npx tsc --noEmit
npm run build
```

Use [docs/deployment-checklist.md](docs/deployment-checklist.md) before deploying beyond local demo or sandbox environments.

## Demo Mode

Set `AI_ERP_DEMO_MODE=true`, `AI_ERP_SANDBOX_MODE=true`, and `NEXT_PUBLIC_AI_ERP_DEMO_MODE=true` for sandbox demos. Disable all demo flags for production.

## Production Deploy

```bash
npm run deploy:check
```

`deploy:check` validates production environment settings, applies migrations, and runs a production build.
