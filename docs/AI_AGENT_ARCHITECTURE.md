# ASTRA AI Agent Architecture

## Purpose

ASTRA's AI architecture defines how copilots and agents assist enterprise users while preserving tenant isolation, RBAC, auditability, and human approval controls.

The AI layer should recommend, summarize, classify, detect exceptions, and prepare actions. It should not silently execute material enterprise decisions without explicit policy and audit coverage.

## AI Design Principles

- Permission-aware: agents see only the records the current user or service role is allowed to access.
- Tenant-isolated: no cross-tenant retrieval, memory, embeddings, or prompt context.
- Auditable: recommendations, generated summaries, and proposed actions are logged when used in business workflows.
- Explainable: agent outputs should cite source records, signals, or reasoning summaries when possible.
- Human-in-control: approvals, payments, journal posting, credit releases, and compliance submissions require human or policy-controlled authorization.
- Module-aware: every specialist agent understands the module context it supports.
- Escalation-ready: uncertain or high-risk results route to exception queues.

## Agent Hierarchy

### 1. Enterprise AI Orchestrator

Role:

- Coordinates all ASTRA AI requests.
- Selects the right module agent or copilot.
- Applies tenant, role, policy, and data access constraints.
- Routes outputs to the correct workflow, dashboard, or audit surface.

Responsibilities:

- Intent classification
- Permission checks
- Tool and data source selection
- Context assembly
- Agent routing
- Response normalization
- Audit metadata capture
- Escalation to human review

### 2. Executive and Role Copilots

Role copilots are user-facing AI assistants.

Recommended copilots:

- CFO Copilot
- Controller Copilot
- Procurement Copilot
- Sales Operations Copilot
- Supplier Operations Copilot
- Inventory Copilot
- Production Copilot
- Compliance Copilot
- Board MIS Copilot
- Admin Copilot

Common capabilities:

- Summarize dashboard state
- Answer questions over permitted records
- Explain KPI movements
- Draft action plans
- Prepare report commentary
- Highlight risks and exceptions
- Recommend next actions

### 3. Module Specialist Agents

Specialist agents operate inside ERP modules.

P2P agents:

- Spend Classification Agent
- Vendor Risk Agent
- PO Exception Agent
- Invoice Matching Agent
- Payment Timing Agent

OTC agents:

- Customer Credit Agent
- Collection Priority Agent
- Revenue Leakage Agent
- Dispute Summary Agent
- Cash Forecast Agent

R2R agents:

- Journal Anomaly Agent
- Reconciliation Matching Agent
- Close Monitor Agent
- Variance Explanation Agent
- Audit Schedule Agent

CRM agents:

- Lead Scoring Agent
- Opportunity Risk Agent
- Next-Best-Action Agent
- Renewal Risk Agent
- Customer Summary Agent

SRM agents:

- Supplier Qualification Agent
- Contract Extraction Agent
- Supplier Performance Agent
- Supplier Compliance Agent

Inventory agents:

- Stockout Prediction Agent
- Slow-Moving Inventory Agent
- Reorder Recommendation Agent
- Shrinkage Detection Agent

Production agents:

- Capacity Risk Agent
- Material Shortage Agent
- Quality Anomaly Agent
- Yield Variance Agent

Compliance agents:

- Filing Risk Agent
- Evidence Completeness Agent
- Control Exception Agent
- Policy Attestation Agent

Board MIS agents:

- Board Narrative Agent
- KPI Variance Agent
- Risk Register Agent
- Decision Brief Agent

### 4. Shared Utility Agents

Shared agents provide reusable AI capabilities.

- Document Extraction Agent
- Entity Resolution Agent
- Classification Agent
- Translation and Summarization Agent
- Notification Drafting Agent
- Report Drafting Agent
- Policy Interpretation Agent
- Anomaly Detection Agent
- Forecasting Agent

## Agent Runtime Model

Each AI request should pass through these stages:

1. Request intake
   - Capture user, tenant, route, module, intent, and requested action.

2. Policy evaluation
   - Verify permissions, module access, data scope, and action risk.

3. Context retrieval
   - Retrieve only permitted records, metrics, audit events, documents, and workflow state.

4. Agent selection
   - Route to the appropriate role copilot, specialist agent, or utility agent.

5. Tool execution
   - Run approved tools for retrieval, summarization, classification, scoring, or draft generation.

6. Guardrail review
   - Validate output format, sensitive data exposure, action risk, confidence, and escalation policy.

7. Response delivery
   - Return output to the user, workflow, dashboard, or report.

8. Audit capture
   - Record prompt metadata, source references, output summary, confidence, and any proposed action.

## AI Memory and Context

ASTRA should separate durable business records from AI memory.

Allowed context:

- Current user's permitted records
- Tenant configuration
- Workflow state
- Module metadata
- Audit history relevant to the record
- Approved knowledge base content
- Industry template rules

Restricted context:

- Other tenants' records
- Secrets and credentials
- Raw authentication tokens
- Unapproved private user notes
- Sensitive data outside the user's permission scope

Memory strategy:

- Store durable facts in normal ASTRA business records.
- Store AI outputs as audit-linked recommendations or summaries.
- Store embeddings only with tenant scope and source references.
- Expire transient conversational context according to policy.

## Human Approval Boundaries

AI may prepare or recommend:

- Approval summaries
- Risk scores
- Exception alerts
- Draft comments
- Draft report narratives
- Suggested next actions
- Proposed workflow routing
- Suggested journal explanations

AI must not autonomously perform without explicit configured policy:

- Payment release
- Supplier approval
- Customer credit release
- Journal posting
- Financial close certification
- Compliance filing submission
- User permission elevation
- Deletion of audit evidence
- Board pack certification

## AI Risk and Exception Framework

Every AI signal should include:

- Module
- Source record
- Signal type
- Severity
- Confidence
- Explanation
- Recommended action
- Created timestamp
- Resolution status
- Audit reference

Severity levels:

- Low: informational or low business impact
- Medium: requires review during normal operations
- High: requires timely owner action
- Critical: requires escalation and tracked remediation

## Agent Observability

Track:

- Agent usage by module
- Response latency
- Confidence distribution
- Escalation rates
- Human acceptance or rejection
- False positives
- False negatives
- Audit coverage
- Cost per request
- Tool failure rates

## Security and Governance

Required controls:

- Tenant-scoped retrieval
- RBAC-aware prompts and tools
- No secret exposure
- Output filtering
- Prompt injection defenses for documents and web content
- AI action logging
- Model and prompt version tracking
- Human override
- Data retention policy

## Integration With Workflow Engine

Agents should interact with workflows through controlled commands:

- Create risk alert
- Suggest assignee
- Suggest approval route
- Draft approval comment
- Summarize evidence
- Flag exception
- Recommend escalation
- Prepare report narrative

Workflow engine remains the authority for:

- State transitions
- Approval completion
- SLA tracking
- Audit event creation
- Permission enforcement

## Implementation Phases

1. Read-only copilots
   - Summaries, question answering, dashboard explanations.

2. Recommendation agents
   - Risk alerts, prioritization, draft actions, variance explanations.

3. Workflow-assisted agents
   - Agent-created tasks and exception alerts requiring human review.

4. Policy-controlled automation
   - Low-risk automated routing and reminders with audit coverage.

5. Advanced forecasting
   - Cash, demand, inventory, production, and compliance risk forecasts.
