# ASTRA Module Roadmap

## Roadmap Objective

This roadmap defines the target module expansion path for ASTRA as a Super ERP platform. It prioritizes enterprise stability, workflow reuse, finance impact visibility, and AI-assisted operations.

## Roadmap Principles

- Extend from shared foundations before building deep module-specific features.
- Keep modules independently releasable.
- Use one workflow, audit, approval, notification, and AI signal pattern across modules.
- Avoid database or UI fragmentation between industries.
- Treat finance impact and audit evidence as first-class outputs of operational modules.

## Foundation Capabilities

These capabilities should support every module.

- Tenant isolation
- RBAC and permission policies
- Configurable workflow stages
- Approval matrix
- Audit logs
- Document attachments
- Notifications and reminders
- AI risk and exception alerts
- Finance impact summaries
- Report export framework
- Integration event tracking
- Module configuration
- Custom fields
- Master data references

## Phase 1 - Core Operating Layer

Focus:

- Dashboard shell
- Auth and RBAC
- Workflow engine
- Approval inbox
- Audit logging
- Finance dashboard
- AI dashboard
- Reporting exports
- Settings and configuration

Outcome:

ASTRA operates as a secure enterprise workflow and finance command center.

## Phase 2 - Finance Operations Modules

### P2P - Procure to Pay

Scope:

- Purchase requisition
- Supplier selection
- Purchase orders
- Goods receipt
- Supplier invoice
- Three-way match
- Payment approval
- Payment release

Priority workflows:

- Requisition to PO
- PO approval
- Invoice exception review
- Payment release approval

AI capabilities:

- Duplicate invoice alert
- Vendor risk alert
- Spend policy exception
- Payment timing recommendation

### OTC - Order to Cash

Scope:

- Customer onboarding
- Credit review
- Quote and order
- Delivery confirmation
- Invoice generation
- Collection tracking
- Receipt matching
- Dispute resolution

Priority workflows:

- Customer approval
- Credit hold release
- Sales order approval
- Collection escalation

AI capabilities:

- Credit risk scoring
- Collection prioritization
- Dispute summary
- Cash receipt forecast

### R2R - Record to Report

Scope:

- Journal entry
- Accruals
- Reconciliations
- Period close checklist
- Trial balance
- Management reports
- Audit schedules

Priority workflows:

- Journal approval
- Account reconciliation
- Close task completion
- Variance review

AI capabilities:

- Journal anomaly detection
- Reconciliation matching
- Close bottleneck alert
- Variance explanation

Outcome:

ASTRA becomes finance-aware across spend, revenue, cash, controls, and reporting.

## Phase 3 - Relationship Operations

### CRM

Scope:

- Lead management
- Account management
- Contact management
- Opportunity pipeline
- Quotes
- Customer interactions
- Renewals

Priority workflows:

- Lead qualification
- Opportunity approval
- Quote approval
- Renewal risk review

AI capabilities:

- Lead scoring
- Opportunity risk
- Next-best action
- Forecast confidence

### SRM

Scope:

- Supplier onboarding
- Qualification
- Contract records
- Performance scorecards
- Supplier risk reviews
- Compliance documents

Priority workflows:

- Supplier onboarding approval
- Contract review
- Supplier risk remediation
- Document expiry follow-up

AI capabilities:

- Supplier risk summary
- Missing document detection
- Contract clause extraction
- Performance anomaly detection

Outcome:

ASTRA connects enterprise workflows to customer and supplier relationships.

## Phase 4 - Supply Chain and Production

### Inventory

Scope:

- Item master
- Warehouse and bin tracking
- Stock ledger
- Transfers
- Cycle counts
- Reservations
- Reorder planning
- Valuation

Priority workflows:

- Stock adjustment approval
- Transfer approval
- Cycle count exception
- Reorder recommendation review

AI capabilities:

- Stockout prediction
- Slow-moving stock alert
- Shrinkage detection
- Reorder recommendation

### Production

Scope:

- Bill of materials
- Routings
- Work orders
- Material issue
- Shop floor execution
- Quality checks
- Finished goods receipt
- Production costing

Priority workflows:

- Work order release
- Material shortage exception
- Quality hold review
- Production variance approval

AI capabilities:

- Capacity risk alert
- Material shortage prediction
- Quality anomaly detection
- Yield variance summary

Outcome:

ASTRA supports operational execution from supply planning to production output.

## Phase 5 - Governance and Executive Intelligence

### Compliance

Scope:

- Statutory calendar
- Filing obligations
- Policy attestations
- Control testing
- Evidence collection
- Exceptions
- Audit readiness

Priority workflows:

- Filing review
- Evidence collection
- Control exception remediation
- Policy attestation

AI capabilities:

- Filing risk alert
- Evidence completeness check
- Control exception summary
- Compliance calendar assistant

### Board MIS

Scope:

- Executive KPI scorecards
- Finance summaries
- Operational performance
- Risk register
- Compliance posture
- Cash outlook
- Board packs

Priority workflows:

- Board pack preparation
- KPI certification
- Management commentary review
- Risk escalation

AI capabilities:

- Narrative generation
- Variance explanation
- Decision brief preparation
- Risk trend summary

Outcome:

ASTRA becomes the executive operating system for enterprise visibility and governance.

## Cross-Module Dependencies

P2P depends on:

- Suppliers
- Items
- Cost centers
- Approval policies
- Finance impact model

OTC depends on:

- Customers
- Items or services
- Credit policies
- Tax profiles
- Receipt matching

R2R depends on:

- Chart of accounts
- Journals
- Period calendar
- Reconciliation rules
- Reporting definitions

CRM depends on:

- Customers
- Contacts
- Sales users
- Product catalog
- Revenue forecast model

SRM depends on:

- Suppliers
- Contracts
- Compliance document types
- Performance scorecards

Inventory depends on:

- Items
- Warehouses
- Locations
- Stock ledger
- Valuation policies

Production depends on:

- Items
- BOMs
- Routings
- Work centers
- Inventory availability
- Costing policies

Compliance depends on:

- Legal entities
- Statutory calendar
- Control library
- Evidence registry
- Audit log

Board MIS depends on:

- Finance facts
- Workflow facts
- Operational KPIs
- AI risk signals
- Certified report definitions

## Module Readiness Checklist

Before a module is marked enterprise-ready:

- It has tenant-scoped data boundaries.
- It has role-gated routes and APIs.
- It has workflow stages.
- It has approval flows.
- It writes audit logs.
- It has AI risk or exception signals.
- It exposes finance impact where applicable.
- It supports empty, loading, and error states.
- It has seeded demo data.
- It appears in reporting or analytics where relevant.
- It passes TypeScript, lint, build, and route protection audits.

## Recommended Build Order

1. P2P
2. OTC
3. R2R
4. Board MIS
5. SRM
6. CRM
7. Inventory
8. Production
9. Compliance
10. Advanced analytics and industry templates
