# ASTRA Industry Template Strategy

## Purpose

Industry templates let ASTRA adapt to different enterprise operating models without creating separate products or code forks. A template should configure modules, workflows, roles, approvals, fields, reports, AI signals, and integrations for a specific industry pattern.

## Template Principles

- Configuration over customization
- Shared core objects across all industries
- Tenant-specific overrides
- Versioned templates
- Clear upgrade paths
- No hard-coded industry behavior in application code
- AI prompts and policies scoped to the selected template
- Audit and compliance controls preserved across all templates

## Template Components

Each industry template should define:

- Enabled modules
- Default roles
- Workflow stages
- Approval policies
- Custom fields
- Document requirements
- Master data presets
- Tax and compliance assumptions
- Report packs
- Board MIS layout
- AI agent defaults
- Exception rules
- Integration recommendations
- Demo seed data profile

## Common Template Foundation

Every template should include:

- Dashboard
- Workflow engine
- Approval inbox
- Audit logs
- Finance impact summary
- Notifications
- AI risk alerts
- Board MIS
- Configuration console

## Recommended Industry Templates

### 1. Manufacturing

Primary modules:

- P2P
- Inventory
- Production
- R2R
- Compliance
- Board MIS

Key workflows:

- Purchase requisition
- Supplier invoice match
- Material issue
- Work order release
- Quality hold review
- Production variance approval
- Period close

Industry fields:

- Plant
- Work center
- BOM version
- Batch number
- Quality status
- Scrap reason
- Machine downtime code

AI priorities:

- Material shortage prediction
- Capacity risk
- Quality anomaly detection
- Inventory valuation risk
- Production variance explanation

Board MIS focus:

- Revenue and margin
- Production output
- Inventory turns
- Scrap and yield
- Working capital
- Order backlog
- Compliance exceptions

### 2. Trading and Distribution

Primary modules:

- P2P
- OTC
- Inventory
- SRM
- CRM
- Board MIS

Key workflows:

- Supplier onboarding
- Purchase order approval
- Stock transfer
- Sales order approval
- Credit hold release
- Collection escalation

Industry fields:

- Warehouse
- Channel
- Distributor
- Region
- Batch or lot
- Expiry date
- Price list

AI priorities:

- Stockout prediction
- Slow-moving inventory
- Customer credit risk
- Supplier delay risk
- Collection priority

Board MIS focus:

- Sales by channel
- Gross margin
- Inventory aging
- Receivables aging
- Supplier fill rate
- Stockout risk

### 3. Professional Services

Primary modules:

- CRM
- OTC
- R2R
- Compliance
- Board MIS

Key workflows:

- Lead qualification
- Proposal approval
- Contract review
- Project billing
- Expense approval
- Revenue recognition review
- Period close

Industry fields:

- Project
- Engagement
- Partner
- Billing milestone
- Utilization category
- Client segment

AI priorities:

- Opportunity scoring
- Revenue forecast confidence
- Billing leakage detection
- Contract risk summary
- Utilization variance explanation

Board MIS focus:

- Pipeline
- Revenue
- Utilization
- Margin
- Receivables
- Project risk

### 4. Finance and Accounting Operations

Primary modules:

- R2R
- P2P
- OTC
- Compliance
- Board MIS

Key workflows:

- Journal approval
- Reconciliation review
- Vendor payment approval
- Collection escalation
- Filing readiness
- Close checklist

Industry fields:

- Legal entity
- Account
- Cost center
- Tax period
- Reconciliation owner
- Close task
- Audit evidence type

AI priorities:

- Journal anomaly detection
- Reconciliation matching
- Variance explanation
- Filing risk
- Audit evidence completeness

Board MIS focus:

- Close readiness
- Cash position
- Revenue and expense variance
- Compliance status
- Audit exceptions

### 5. Multi-Entity Enterprise Group

Primary modules:

- R2R
- P2P
- OTC
- Compliance
- Board MIS
- Integration layer

Key workflows:

- Intercompany journal approval
- Entity-level close
- Consolidated reporting
- Group procurement approval
- Compliance certification
- Board pack approval

Industry fields:

- Legal entity
- Group company
- Consolidation code
- Currency
- Intercompany partner
- Reporting hierarchy

AI priorities:

- Intercompany mismatch detection
- Consolidation variance explanation
- Entity close risk
- Group cash outlook
- Compliance gap summary

Board MIS focus:

- Consolidated financials
- Entity performance
- Cash by entity
- Risk register
- Compliance calendar
- Board commentary

## Template Configuration Model

Templates should be expressed as versioned configuration packages.

Package contents:

- Template metadata
- Module enablement
- Role definitions
- Workflow definitions
- Approval policies
- Custom fields
- Report definitions
- AI policy definitions
- Integration recommendations
- Seed data profile

Template lifecycle:

1. Draft
2. Internal review
3. Pilot tenant
4. Released
5. Versioned upgrade
6. Deprecated

## Tenant Overrides

Tenants should be able to override:

- Approval thresholds
- Role assignments
- Workflow stage names
- SLA targets
- Custom fields
- Report labels
- Notification rules
- Integration settings
- AI alert thresholds

Tenants should not override:

- Core tenant isolation controls
- Audit log requirements
- Authentication security controls
- Required permission checks
- System-owned compliance evidence records

## AI Agent Template Strategy

Each template should configure:

- Default AI copilots
- Module-specific agents
- Risk signal thresholds
- Industry terminology
- Report narrative style
- Escalation rules
- Evidence requirements

Example:

- Manufacturing enables Production Copilot and Inventory Copilot by default.
- Professional Services enables CRM Copilot and Board MIS Copilot by default.
- Finance Operations enables Controller Copilot and Compliance Copilot by default.

## Analytics Template Strategy

Each industry template should include a recommended KPI library.

Shared KPIs:

- Revenue
- Expense
- Cash position
- Approval aging
- Workflow SLA
- Audit exceptions
- AI risk alerts

Industry-specific KPIs:

- Manufacturing: yield, scrap, capacity utilization, inventory turns
- Distribution: stockout risk, fill rate, receivable aging, channel margin
- Professional services: utilization, project margin, billing leakage, pipeline coverage
- Finance operations: close readiness, reconciliation status, filing risk
- Multi-entity groups: consolidation variance, entity close readiness, intercompany exceptions

## Template Rollout Process

1. Select industry template.
2. Create sandbox tenant.
3. Load template configuration and seed profile.
4. Map customer roles and approval thresholds.
5. Validate workflows with customer scenarios.
6. Configure integrations.
7. Review AI signal thresholds.
8. Validate Board MIS outputs.
9. Run security and route access checks.
10. Promote to production tenant.

## Success Criteria

- A new tenant can start from a template without engineering intervention.
- Templates produce useful workflows, reports, and AI alerts on day one.
- Tenant overrides do not break shared platform guarantees.
- Template upgrades can be applied without losing customer-specific configuration.
- Board MIS outputs reflect the selected industry's operating priorities.
