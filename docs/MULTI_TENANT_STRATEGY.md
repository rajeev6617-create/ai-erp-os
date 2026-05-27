# ASTRA Multi-Tenant Strategy

## Purpose

This document defines the target multi-tenant SaaS architecture for ASTRA. It focuses on tenant isolation, scalable operations, enterprise deployment options, data safety, customization, integrations, analytics, and AI governance.

## Multi-Tenant SaaS Vision

ASTRA should support multiple customer organizations on shared platform infrastructure while preserving strong logical isolation. The platform should also support enterprise variants where customers require dedicated databases, dedicated regions, private networking, or single-tenant deployments.

The tenant boundary must be enforced consistently across:

- Authentication and sessions.
- Users, roles, and permissions.
- Domain records.
- Workflow execution.
- Audit logs.
- Files and evidence.
- Background jobs.
- Events and webhooks.
- Analytics.
- AI context and memory.
- Integration credentials.

## Tenant Model

Primary tenant entity:

- Organization.

Tenant-scoped entities:

- Users through memberships.
- Roles and role assignments.
- Departments and operating units.
- Workflows and approvals.
- ERP module records.
- Audit logs and activity logs.
- Domain events and outbox records.
- Integration credentials and sync logs.
- Reports, dashboards, exports, and AI insights.

Cross-tenant entities should be rare and limited to platform administration, billing, marketplace packages, and anonymized operational metrics.

## Isolation Strategy

### Shared Database, Tenant-Scoped Rows

Default for SME and mid-market SaaS.

Characteristics:

- Single application deployment.
- Shared database.
- Every tenant-owned table includes an organization or tenant identifier.
- All service queries enforce tenant scope.
- Strong RBAC and audit controls.

Benefits:

- Fast onboarding.
- Lower cost.
- Easier operations.
- Shared upgrades.

Risks to control:

- Query bugs causing cross-tenant reads.
- Reporting queries missing tenant filters.
- Background jobs processing wrong tenant context.
- AI context builder over-fetching.

### Dedicated Database per Tenant

Option for larger enterprises.

Characteristics:

- Shared application or dedicated application deployment.
- Dedicated database connection per enterprise tenant.
- Tenant routing determines database connection.
- Stronger blast-radius isolation.

Benefits:

- Stronger data isolation.
- Easier enterprise backup and restore.
- Custom retention and region controls.
- Performance isolation.

Risks to control:

- Migration coordination.
- Operational complexity.
- Connection management.
- Version drift.

### Single-Tenant Private Deployment

Option for regulated customers.

Characteristics:

- Dedicated app runtime.
- Dedicated database.
- Dedicated object storage.
- Optional private network.
- Customer-specific deployment controls.

Benefits:

- Maximum isolation.
- Compliance and procurement alignment.
- Custom network and key policies.

Risks to control:

- Upgrade lag.
- Support complexity.
- Higher deployment cost.

## Recommended Tenancy Tiers

| Tier | Target Customer | Data Model | Deployment | Notes |
| --- | --- | --- | --- | --- |
| Shared SaaS | SME and standard mid-market | Shared DB, tenant rows | Shared app | Default product motion |
| Enterprise SaaS | Larger enterprise | Dedicated DB optional | Shared or dedicated app | SSO, SCIM, retention, integrations |
| Regulated Private | Highly regulated enterprise | Dedicated DB | Dedicated app/VPC | Private networking and stricter controls |

## Tenant Context Resolution

Every request should resolve:

- User identity.
- Session ID.
- Organization ID.
- Membership.
- Roles and permissions.
- MFA and policy state.
- Request metadata.
- Correlation ID.

Every background job should receive:

- Organization ID.
- Actor type: user, system, integration, or AI agent.
- Resource scope.
- Idempotency key.
- Correlation ID.

Every event should include:

- Organization ID.
- Event type.
- Resource type and ID.
- Actor ID or service identity.
- Timestamp.
- Correlation ID.

## Authorization Strategy

Authorization should combine:

- RBAC: role-based access to modules and actions.
- Tenant membership: users can act only inside authorized organizations.
- Resource ownership: department, location, cost center, customer, vendor, or project constraints.
- Approval policy: thresholds, segregation of duties, and escalation rules.
- Feature flags: tenant-level module enablement.

Future enterprise extension:

- ABAC attributes such as country, department, warehouse, cost center, and data classification.

## Data Partitioning

Shared database tables should follow these rules:

- Tenant-owned tables include organizationId.
- Unique constraints include organizationId where business identifiers can repeat across tenants.
- Indexes support organizationId plus common filters.
- All service APIs accept tenant context from auth, not from untrusted client input.
- Bulk imports validate tenant ownership for related records.
- Analytics views include tenant filters.

Dedicated database routing should follow these rules:

- Tenant registry stores connection metadata outside tenant databases.
- Application resolves tenant before database access.
- Migrations are applied consistently across all active tenant databases.
- Health checks run per tenant database tier.

## Customization Strategy

Tenant customization should be configuration-driven.

Supported configuration:

- Enabled modules.
- Navigation.
- Custom fields.
- Workflow stages and transitions.
- Approval thresholds.
- SLA policies.
- Dashboard cards.
- Report packs.
- AI thresholds.
- Integration mappings.
- Retention policies.

Rules:

- Configuration changes must be audited.
- Config should be versioned where it affects workflows or data interpretation.
- Template defaults must be distinguishable from tenant overrides.
- Tenant admins should be able to preview risky workflow changes.

## Plugin Architecture

Plugins must be tenant-safe.

Plugin types:

- UI widgets.
- Domain actions.
- Integration adapters.
- Report packs.
- AI tools.
- Template packages.

Plugin controls:

- Explicit tenant installation.
- Permission scopes.
- Version and compatibility metadata.
- Audit logs for install, update, and removal.
- No direct database access.
- API-only interaction through governed service contracts.
- Secret access only through tenant-scoped vault references.

## Integration Tenancy

Each integration must be tenant-scoped.

Integration records should store:

- Organization ID.
- Provider.
- Environment.
- Credential reference.
- Allowed scopes.
- Sync status.
- Last success and last failure.
- Retry policy.
- Owner role.

Integration rules:

- Use encrypted credential storage.
- Never share credentials across tenants.
- Record inbound and outbound sync events.
- Use idempotency keys for imports.
- Validate tenant ownership for every external reference.
- Provide manual retry and reconciliation views.

## Analytics Tenancy

Analytics should preserve tenant isolation across live dashboards and warehouse exports.

Patterns:

- Live dashboards query tenant-scoped operational records.
- Aggregates include organization ID.
- Data warehouse exports use tenant-specific destinations or partitioned datasets.
- Cross-tenant benchmark analytics require explicit anonymization and contractual permission.
- Board and executive MIS should never mix tenant data.

## AI Tenancy

AI context must be tenant-scoped by default.

AI controls:

- Context builder receives organization ID from trusted auth or job context.
- Source records are permission-filtered.
- Prompt logs redact sensitive fields where needed.
- AI memory is tenant-scoped.
- Tool calls enforce tenant and role policy.
- AI-generated recommendations include source references.
- Cross-tenant training is disabled unless explicitly contracted.

## Data Lifecycle

Tenant lifecycle stages:

- Trial or demo tenant.
- Active tenant.
- Suspended tenant.
- Exporting tenant.
- Deleted or archived tenant.

Lifecycle requirements:

- Onboarding creates organization, admin, roles, default configuration, and template data.
- Suspension blocks user access but preserves records.
- Export supports audit, records, documents, and configuration.
- Deletion follows contractual retention and legal hold rules.
- Backups and restore plans differ by tenancy tier.

## Deployment Strategy

Shared SaaS:

- Single application deployment.
- Shared database and object storage with tenant-scoped keys.
- Standard monitoring and backups.

Enterprise SaaS:

- Optional dedicated database.
- SSO and SCIM.
- Custom retention and audit exports.
- Higher rate limits and integration capacity.

Private deployment:

- Dedicated app and database.
- Optional private networking.
- Dedicated object storage.
- Customer-specific release cadence.

## Operational Controls

Required operations:

- Tenant health dashboard.
- Per-tenant usage metering.
- Per-tenant job queue visibility.
- Migration status by environment and tenant tier.
- Integration failure monitoring.
- Rate limiting by tenant and user.
- Backup and restore verification.
- Incident blast-radius tagging.

## Practical Implementation Sequence

1. Enforce organizationId across tenant-owned models.
2. Centralize tenant context in auth and service APIs.
3. Add query helpers and code review rules for tenant filters.
4. Scope background jobs and events by organizationId.
5. Scope integration credentials and sync logs by tenant.
6. Add tenant configuration and module flags.
7. Add tenant analytics aggregates.
8. Add dedicated database routing for enterprise tier.
9. Add private deployment automation for regulated customers.

## Guardrails

- Do not accept organizationId from the browser as authority when auth already provides tenant context.
- Do not run background jobs without tenant context.
- Do not let AI retrieve cross-tenant data.
- Do not store integration secrets in plain configuration records.
- Do not create tenant-specific code forks for standard customization.
- Do not run migrations against enterprise tenant databases without status tracking and rollback planning.
