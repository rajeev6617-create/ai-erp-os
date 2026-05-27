# ASTRA Module Roadmap

## Roadmap Objective

This roadmap translates the ASTRA Super ERP blueprint into a practical execution path. It prioritizes durable platform capabilities first, then expands module depth, AI automation, industry templates, and enterprise deployment readiness.

## Roadmap Principles

- Ship stable modules before deep specialization.
- Reuse shared workflow, approval, audit, finance impact, analytics, and AI services.
- Keep every module tenant-safe and API-addressable.
- Build SME-ready paths without blocking enterprise-grade controls.
- Make AI useful through exception detection, summaries, forecasts, and recommendations before autonomous execution.

## Phase 1 - Platform Control Plane

Goal: establish the core enterprise operating layer.

Scope:

- Authentication, session management, tenant context, roles, and permissions.
- Dashboard shell, navigation, settings, and configuration.
- Workflow definitions, executions, approvals, SLA states, and notifications.
- Audit logs, activity logs, request metadata, and evidence references.
- Finance foundation: fiscal year, ledger accounts, journal structures, finance rules.
- AI agent foundation: role-aware AI assistants, audit-ready recommendations, safe API boundaries.
- Reporting foundation: PDF and Excel exports, MIS-ready summaries.

Exit criteria:

- Every dashboard route is protected.
- Every material workflow action writes audit evidence.
- Core APIs return consistent errors.
- Production build, lint, TypeScript, route audit, and migration checks are stable.

## Phase 2 - Finance and Operations Foundation

Goal: connect spend, revenue, close, and user operations into a common control plane.

Modules:

- P2P Procure to Pay.
- OTC Order to Cash.
- R2R Record to Report.
- HR/User Operations.

Execution scope:

- Dashboards for each module.
- Workflow stages and approval flows.
- Audit logs and exception tracking.
- Finance impact summaries.
- Seeded demo data and safe sample workflows.
- AI risk alerts for policy, cash, control, and operational exceptions.

AI focus:

- AI CFO: cash timing, budget pressure, close risk.
- AI Auditor: approval evidence, segregation of duties, policy exceptions.
- AI Procurement Manager: spend variance, duplicate invoice, vendor concentration.

## Phase 3 - Relationship Portals

Goal: extend ASTRA to customers and vendors while preserving tenant boundaries.

Modules:

- CRM.
- SRM.
- Customer portal.
- Vendor portal.
- Lead management.
- Sales pipeline.
- Vendor onboarding.
- Ticketing and support foundation.

Execution scope:

- Portal authentication separated from internal user authentication.
- Customer and vendor records linked to workflows, tickets, orders, invoices, and onboarding cases.
- Audit logs for portal login, updates, submissions, and approvals.
- AI insights for pipeline risk, vendor risk, account health, and support priority.

AI focus:

- AI Executive Copilot: customer and vendor health summaries.
- AI Procurement Manager: vendor onboarding and supplier risk.
- AI Operations Manager: support escalations and portal-driven exceptions.

## Phase 4 - Inventory, Warehouse, Production, and Quality

Goal: support physical operations and manufacturing workflows.

Modules:

- Inventory.
- Warehouse.
- Stock movement.
- GRN.
- Dispatch.
- BOM.
- Production planning.
- Quality control.

Execution scope:

- Item, warehouse, stock, movement, GRN, dispatch, BOM, production plan, and quality records.
- Stock adjustment and transfer workflows.
- GRN and dispatch operational states.
- Production plan status, capacity signals, and output tracking.
- QC checks, holds, defects, and quality evidence.
- Inventory analytics and AI alerts.

AI focus:

- AI Operations Manager: stockout risk, dispatch delay, production schedule risk.
- AI Procurement Manager: supplier lot and material shortage risk.
- AI Auditor: inventory variance, QC evidence, adjustment approvals.

## Phase 5 - Executive Intelligence and Board MIS

Goal: turn ASTRA into an executive operating system.

Modules:

- CEO dashboard.
- CFO dashboard.
- Board MIS.
- Enterprise KPIs.
- AI forecasting.
- Anomaly detection.
- Predictive analytics.
- AI copilots.
- Strategic insights.

Execution scope:

- Executive KPI model across finance, operations, workflow, risk, and customer health.
- Forecast model for cash, revenue, cost, capacity, risk, and close readiness.
- Board pack model with CFO signoff, governance summary, and audit trace.
- Executive AI recommendations with confidence, source context, and action suggestions.

AI focus:

- AI CFO: cash runway, margin, working capital, close exposure.
- AI Executive Copilot: board narrative, strategic risks, decision prompts.
- AI Auditor: control health, exception closure, governance readiness.

## Phase 6 - Compliance and Enterprise Controls

Goal: support regulated and enterprise-grade customers.

Modules:

- Compliance obligations.
- Control testing.
- Evidence management.
- Policy exceptions.
- Remediation tracking.
- Access reviews.

Execution scope:

- Control library and obligation mapping.
- Evidence requests and recurring control workflows.
- Policy exceptions and remediation approvals.
- Audit-ready exports.
- Risk register integration.
- Enterprise SSO, SCIM, advanced RBAC, and retention controls.

AI focus:

- AI Compliance Officer: obligation mapping, evidence gaps, control drift.
- AI Auditor: anomaly detection, audit pack preparation, policy exception review.

## Phase 7 - Industry Templates and Plugin Ecosystem

Goal: package ASTRA for repeatable industry adoption and controlled extensibility.

Scope:

- Manufacturing template.
- Distribution template.
- Services template.
- Regulated operations template.
- Retail/ecommerce operations template.
- Plugin architecture for UI extensions, integrations, reports, and AI tools.

Execution scope:

- Template installer and versioning.
- Configurable workflows, roles, fields, dashboards, and reports.
- Migration-safe template upgrades.
- Partner and customer plugin model.
- API-first extension rules.

## Module Roadmap Matrix

| Module | MVP Capability | Enterprise Depth | AI Leverage | Priority |
| --- | --- | --- | --- | --- |
| P2P | Requisition, PO, invoice, payment approval | 3-way match, vendor terms, budget controls | Duplicate invoice, spend variance, cash timing | High |
| OTC | Order, invoice, collection, dispute | Credit holds, revenue recognition, customer risk | Collection forecast, dispute risk | High |
| R2R | Journals, reconciliations, close tasks | Close calendar, evidence, intercompany, reporting packs | Close anomaly, missing evidence | High |
| CRM | Leads, opportunities, customers, tickets | Account plans, renewals, support SLAs | Pipeline forecast, churn risk | Medium |
| SRM | Vendors, onboarding, contracts | Supplier scorecards, compliance renewals | Vendor risk, SLA drift | Medium |
| Inventory | Items, stock balances, movements | Valuation, lots, cycle counts | Stockout risk, dead stock | High |
| Warehouse | GRN, putaway, pick, dispatch | Bin management, barcode/RFID, labor planning | Dock congestion, pick delay | Medium |
| Production | BOM, plans, work orders | Routing, capacity, variance costing | Schedule slip, capacity risk | Medium |
| Quality | QC checks, holds, defects | CAPA, supplier quality, inspection plans | Yield anomaly, defect clustering | Medium |
| HR/User Operations | Users, roles, access requests | Access reviews, workload, onboarding | Access risk, orphaned permissions | High |
| Compliance | Controls, obligations, evidence | Risk register, remediation, audit packs | Control drift, evidence gap | High |
| Board/Executive MIS | KPIs, forecasts, board packs | Strategy tracking, governance signoff | Strategic insights, executive copilot | High |

## Business Strategy Roadmap

### SME Roadmap

SME product motion should be fast, guided, and template-led.

- Month 0-3: approvals, finance basics, P2P, OTC, R2R starter dashboards.
- Month 3-6: inventory, CRM/SRM portals, executive MIS, AI alerts.
- Month 6-12: industry starter templates, mobile approvals, import/export tooling.

Commercial focus:

- Low-friction onboarding.
- Fixed implementation packages.
- Module bundles.
- Clear upgrade path to enterprise controls.

### Enterprise Roadmap

Enterprise product motion should be governance-led.

- Advanced identity: SSO, SCIM, MFA policy, session policy.
- Advanced authorization: RBAC, ABAC attributes, approval segregation.
- Dedicated data options: dedicated database, region, private network.
- Integration depth: ERP, finance, identity, document storage, data warehouse.
- Audit and compliance exports.
- AI governance, evaluation, prompt controls, and model policy.

### Industry Adaptation Roadmap

1. Manufacturing: production, inventory, quality, P2P, dispatch, executive MIS.
2. Distribution: warehouse, stock, sales orders, vendor management, logistics.
3. Professional services: projects, approvals, revenue, expenses, customer support.
4. Regulated services: compliance, evidence, vendor controls, access governance.
5. Retail/ecommerce: inventory, orders, returns, customer support, finance controls.

### Monetization Roadmap

Pricing dimensions:

- Platform subscription.
- Module bundles.
- Active user seats.
- Portal users or external party volume.
- AI usage and premium copilots.
- Integration packs.
- Industry templates.
- Enterprise controls and dedicated deployment.

### Deployment Strategy

- Shared SaaS: standard customers and SMEs.
- Enterprise SaaS: dedicated database, custom retention, SSO, and advanced integrations.
- Private cloud: regulated enterprise customers.
- Hybrid bridge: controlled integration with on-premise finance, ERP, or warehouse systems.

## Execution Governance

Every module release should pass:

- TypeScript, lint, production build.
- Prisma migration validation and drift check when schema changes.
- Route protection audit for dashboard surfaces.
- Seed data check for demo paths.
- RBAC and tenant-scope review.
- Audit event review.
- AI safety review when recommendations or actions are introduced.
