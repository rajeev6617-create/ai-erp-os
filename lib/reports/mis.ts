import type { FinanceDashboardData } from "@/lib/dashboard/finance";
import { getFinanceDashboard } from "@/lib/dashboard/finance";
import { getOperationsDashboard } from "@/lib/workflows/queries";
import type { OperationsDashboardData, WorkflowCardData } from "@/lib/workflows/types";

export type MisReportScope = "workflows" | "finance" | "all";

export interface MisReport {
  fileName: string;
  contentType: string;
  body: string;
}

export async function buildExcelMisReport(params: {
  organizationId: string;
  organizationName: string;
  scope: MisReportScope;
}): Promise<MisReport> {
  const [operations, finance] = await Promise.all([
    params.scope === "finance" ? null : getOperationsDashboard(params.organizationId),
    params.scope === "workflows" ? null : getFinanceDashboard(params.organizationId),
  ]);
  const worksheets = [
    summaryWorksheet(params.organizationName, params.scope, operations, finance),
    ...(operations ? workflowWorksheets(operations) : []),
    ...(finance ? financeWorksheets(finance) : []),
  ];

  return {
    fileName: `astra-mis-${params.scope}-${dateStamp()}.xls`,
    contentType: "application/vnd.ms-excel; charset=utf-8",
    body: excelWorkbook(worksheets),
  };
}

export async function buildPdfSummaryPlaceholder(params: {
  organizationId: string;
  organizationName: string;
  scope: MisReportScope;
}): Promise<MisReport> {
  const [operations, finance] = await Promise.all([
    params.scope === "finance" ? null : getOperationsDashboard(params.organizationId),
    params.scope === "workflows" ? null : getFinanceDashboard(params.organizationId),
  ]);
  const lines = [
    "ASTRA Summary Report",
    `Organization: ${params.organizationName}`,
    `Scope: ${params.scope}`,
    `Generated: ${new Date().toISOString()}`,
    operations
      ? `Workflows: ${operations.stats.active} active, ${operations.stats.waitingApproval} waiting approval, ${operations.stats.failed} failed`
      : null,
    operations
      ? `AI risk: max ${operations.intelligence.summary.maxRiskScore}, SLA breaches ${operations.intelligence.summary.predictedSlaBreaches}`
      : null,
    finance
      ? `Finance: revenue MTD ${formatInr(finance.kpis.revenueMtd)}, expenses MTD ${formatInr(finance.kpis.expensesMtd)}`
      : null,
    finance
      ? `GST liability: ${formatInr(finance.gstSummary.netLiability)}, outstanding invoices ${formatInr(finance.kpis.outstandingInvoices)}`
      : null,
    "PDF rendering provider placeholder: wire this payload to a branded PDF renderer when a PDF engine is configured.",
  ].filter((line): line is string => Boolean(line));

  return {
    fileName: `astra-summary-${params.scope}-${dateStamp()}.pdf`,
    contentType: "application/pdf",
    body: minimalPdf(lines),
  };
}

function summaryWorksheet(
  organizationName: string,
  scope: MisReportScope,
  operations: OperationsDashboardData | null,
  finance: FinanceDashboardData | null,
): Worksheet {
  return {
    name: "MIS Summary",
    rows: [
      ["ASTRA MIS Report"],
      ["Organization", organizationName],
      ["Scope", scope],
      ["Generated At", new Date().toISOString()],
      [],
      ...(operations
        ? [
            ["Workflow Active", operations.stats.active],
            ["Waiting Approval", operations.stats.waitingApproval],
            ["Failed Workflows", operations.stats.failed],
            ["Max AI Risk Score", operations.intelligence.summary.maxRiskScore],
            ["Predicted SLA Breaches", operations.intelligence.summary.predictedSlaBreaches],
            ["Finance Anomalies", operations.intelligence.summary.financeAnomalies],
          ]
        : []),
      ...(finance
        ? [
            ["Revenue MTD", finance.kpis.revenueMtd],
            ["Expenses MTD", finance.kpis.expensesMtd],
            ["Outstanding Invoices", finance.kpis.outstandingInvoices],
            ["GST Liability", finance.gstSummary.netLiability],
            ["Budget Utilization", `${finance.kpis.budgetUtilization}%`],
          ]
        : []),
    ],
  };
}

function workflowWorksheets(operations: OperationsDashboardData): Worksheet[] {
  const approvalRows = [
    ...workflowRows("Pending", operations.approvals.pending),
    ...workflowRows("Rejected", operations.approvals.rejected),
    ...workflowRows("Completed", operations.approvals.completed),
  ];

  return [
    {
      name: "Workflow KPIs",
      rows: [
        ["Metric", "Value"],
        ["Active Workflows", operations.stats.active],
        ["Pending Executions", operations.stats.pending],
        ["Completed Today", operations.stats.completedToday],
        ["Failed", operations.stats.failed],
        ["Waiting Approval", operations.stats.waitingApproval],
        ["Average Completion Minutes", operations.stats.avgCompletionMins],
      ],
    },
    {
      name: "Approvals",
      rows: [
        [
          "Queue",
          "Title",
          "Workflow",
          "Status",
          "Priority",
          "Priority Score",
          "Assignee",
          "Requester",
          "Due At",
          "Amount INR",
        ],
        ...approvalRows,
      ],
    },
    {
      name: "AI Intelligence",
      rows: [
        ["Type", "Title", "Severity", "Score", "Confidence", "Evidence"],
        ...operations.intelligence.insights.map((insight) => [
          insight.type,
          insight.title,
          insight.severity,
          insight.score ?? "",
          insight.confidence ?? "",
          insight.evidence?.join(" | ") ?? "",
        ]),
      ],
    },
  ];
}

function financeWorksheets(finance: FinanceDashboardData): Worksheet[] {
  return [
    {
      name: "Finance KPIs",
      rows: [
        ["Metric", "Value"],
        ["Revenue MTD", finance.kpis.revenueMtd],
        ["Expenses MTD", finance.kpis.expensesMtd],
        ["Net Position MTD", finance.kpis.netPositionMtd],
        ["Outstanding Invoices", finance.kpis.outstandingInvoices],
        ["Overdue Invoices", finance.kpis.overdueInvoices],
        ["Pending Payments", finance.kpis.pendingPayments],
        ["Pending Payment Amount", finance.outstandingPayments.amount],
        ["Overdue AP Amount", finance.outstandingPayments.overdueAmount],
        ["Budget Utilization", `${finance.kpis.budgetUtilization}%`],
      ],
    },
    {
      name: "GST Summary",
      rows: [
        ["Metric", "Value"],
        ["Taxable Amount", finance.gstSummary.taxableAmount],
        ["Output GST", finance.gstSummary.outputGstAmount],
        ["Input GST Credit", finance.gstSummary.inputGstAmount],
        ["CGST", finance.gstSummary.cgstAmount],
        ["SGST", finance.gstSummary.sgstAmount],
        ["IGST", finance.gstSummary.igstAmount],
        ["CESS", finance.gstSummary.cessAmount],
        ["TDS Payable", finance.gstSummary.tdsAmount],
        ["Net Liability", finance.gstSummary.netLiability],
      ],
    },
    {
      name: "Outstanding Invoices",
      rows: [
        ["Invoice", "Buyer", "Status", "Due At", "Total", "Paid", "Balance"],
        ...finance.outstandingInvoices.map((invoice) => [
          invoice.invoiceNumber,
          invoice.buyerName,
          invoice.status,
          invoice.dueAt ?? "",
          invoice.totalAmount,
          invoice.paidAmount,
          invoice.balanceAmount,
        ]),
      ],
    },
    {
      name: "Outstanding Payments",
      rows: [
        ["Payment", "Vendor", "Status", "Method", "Amount", "Updated At"],
        ...finance.outstandingPayments.records.map((payment) => [
          payment.paymentNumber,
          payment.vendorName,
          payment.status,
          payment.method,
          payment.amount,
          payment.updatedAt,
        ]),
      ],
    },
    {
      name: "Vendors",
      rows: [
        ["Code", "Vendor", "GSTIN", "Status", "Terms Days", "Outstanding Invoices", "Pending Payments", "MTD Spend"],
        ...finance.vendors.map((vendor) => [
          vendor.code,
          vendor.name,
          vendor.gstin ?? "",
          vendor.status,
          vendor.paymentTermsDays,
          vendor.outstandingInvoices,
          vendor.pendingPayments,
          vendor.expensesMtd,
        ]),
      ],
    },
    {
      name: "Finance Approvals",
      rows: [
        ["Title", "Entity Type", "Workflow", "Status", "Amount", "Requester", "Assignee", "Due At", "Completed At"],
        ...finance.financeApprovalHistory.map((approval) => [
          approval.title,
          approval.entityType,
          approval.workflowName,
          approval.status,
          approval.amount,
          approval.requesterName,
          approval.assigneeName,
          approval.dueAt ?? "",
          approval.completedAt ?? "",
        ]),
      ],
    },
    {
      name: "Expenses",
      rows: [
        ["Category", "Amount", "Count", "Share"],
        ...finance.expenseAnalytics.categories.map((category) => [
          category.category,
          category.amount,
          category.count,
          `${category.share}%`,
        ]),
      ],
    },
    {
      name: "Budgets",
      rows: [
        ["Name", "Category", "Department", "Allocated", "Consumed", "Remaining", "Utilization"],
        ...finance.budgetTracking.budgets.map((budget) => [
          budget.name,
          budget.category,
          budget.departmentName,
          budget.allocated,
          budget.consumed,
          budget.remaining,
          `${budget.utilization}%`,
        ]),
      ],
    },
  ];
}

function workflowRows(queue: string, items: WorkflowCardData[]): Array<Array<string | number>> {
  return items.map((item) => [
    queue,
    item.title,
    item.workflowName,
    String(item.status),
    item.priority,
    item.priorityScore,
    item.assignee.name,
    item.requester.name,
    item.dueAt ?? "",
    amountFromMetadata(item.metadata),
  ]);
}

type Worksheet = {
  name: string;
  rows: Array<Array<string | number>>;
};

function excelWorkbook(worksheets: Worksheet[]): string {
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${worksheets.map(worksheetXml).join("\n")}
</Workbook>`;
}

function worksheetXml(sheet: Worksheet): string {
  return `<Worksheet ss:Name="${xmlEscape(sheet.name.slice(0, 31))}">
  <Table>
${sheet.rows.map(rowXml).join("\n")}
  </Table>
</Worksheet>`;
}

function rowXml(row: Array<string | number>): string {
  return `    <Row>${row.map(cellXml).join("")}</Row>`;
}

function cellXml(value: string | number): string {
  const type = typeof value === "number" ? "Number" : "String";
  return `<Cell><Data ss:Type="${type}">${xmlEscape(String(value))}</Data></Cell>`;
}

function minimalPdf(lines: string[]): string {
  const textCommands = lines
    .map((line, index) => `BT /F1 10 Tf 50 ${760 - index * 16} Td (${pdfEscape(line)}) Tj ET`)
    .join("\n");
  const stream = `${textCommands}\n`;
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${stream.length} >> stream\n${stream}endstream endobj`,
  ];
  let offset = "%PDF-1.4\n".length;
  const xref = ["0000000000 65535 f "];
  const body = objects
    .map((object) => {
      const currentOffset = offset;
      offset += object.length + 1;
      xref.push(`${String(currentOffset).padStart(10, "0")} 00000 n `);
      return object;
    })
    .join("\n");
  const xrefStart = "%PDF-1.4\n".length + body.length + 1;

  return `%PDF-1.4
${body}
xref
0 ${xref.length}
${xref.join("\n")}
trailer << /Size ${xref.length} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;
}

function amountFromMetadata(metadata: Record<string, unknown> | undefined): number | string {
  const value = metadata?.amountInr;
  return typeof value === "number" ? value : "";
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pdfEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
