import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowRightLeft,
  ArrowUpFromLine,
  Bot,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  FileClock,
  GitBranch,
  History,
  Layers3,
  MapPin,
  PackageSearch,
  ScanBarcode,
  ShieldCheck,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { DashboardReportActions } from "@/components/reports/dashboard-report-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type {
  DispatchRecord,
  GrnRecord,
  InventoryAiInsight,
  InventoryApproval,
  InventoryAuditEvent,
  InventoryCapability,
  InventoryFinanceImpact,
  InventoryWarehouseOperationsData,
  ItemMasterRecord,
  MaterialMovementRecord,
  StockLedgerEntry,
  TraceabilityRecord,
  VendorLink,
  WarehouseRecord,
} from "@/lib/operations/inventory-warehouse-data";
import { cn } from "@/lib/utils/cn";

type InventoryWarehouseView = "inventory" | "warehouse";
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const widgetIcons: Record<string, LucideIcon> = {
  "stock-value": CircleDollarSign,
  "low-stock": AlertTriangle,
  "fast-moving": ArrowUpFromLine,
  "slow-moving": ArrowDownToLine,
  "stock-aging": FileClock,
  "warehouse-utilization": Warehouse,
};

export function InventoryWarehouseDashboard({
  data,
  view,
}: {
  data: InventoryWarehouseOperationsData;
  view: InventoryWarehouseView;
}) {
  return (
    <div className="space-y-6">
      <InventoryWarehouseHeader asOf={data.asOf} view={view} />
      <WidgetGrid data={data} />
      <AiInsightsCard insights={data.aiInsights} />
      {view === "inventory" ? (
        <InventoryWorkspace data={data} />
      ) : (
        <WarehouseWorkspace data={data} />
      )}
      <WorkflowIntegration data={data} />
    </div>
  );
}

function InventoryWarehouseHeader({
  asOf,
  view,
}: {
  asOf: string;
  view: InventoryWarehouseView;
}) {
  const isInventory = view === "inventory";

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Enterprise operations</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {isInventory ? "ASTRA Inventory Management" : "ASTRA Warehouse Management"}
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          {isInventory
            ? "Item master, stock ledger, material inward and outward, transfers, adjustments, reorder controls, batch traceability, and serial-level visibility."
            : "Multi-warehouse operations, bin-level capacity, GRN processing, dispatch management, and end-to-end material movement tracking."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <WorkspaceLink
            active={isInventory}
            href="/dashboard/operations/inventory"
            icon={PackageSearch}
            label="Inventory"
          />
          <WorkspaceLink
            active={!isInventory}
            href="/dashboard/operations/warehouse"
            icon={Warehouse}
            label="Warehouse"
          />
          <span className="text-xs text-muted-foreground">
            Demo snapshot {formatDate(asOf)}
          </span>
        </div>
      </div>
      <DashboardReportActions />
    </header>
  );
}

function WorkspaceLink({
  active,
  href,
  icon: Icon,
  label,
}: {
  active: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function WidgetGrid({ data }: { data: InventoryWarehouseOperationsData }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {data.widgets.map((widget) => (
        <StatCard
          key={widget.key}
          label={widget.label}
          value={widget.value}
          change={widget.change}
          trend={widget.trend}
          icon={widgetIcons[widget.key] ?? Boxes}
        />
      ))}
    </section>
  );
}

function AiInsightsCard({ insights }: { insights: InventoryAiInsight[] }) {
  return (
    <section>
      <SectionHeading
        badge="AI monitored"
        description="Predictive stock signals, inventory risk scoring, and demand forecast actions."
        title="ASTRA AI inventory insights"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Bot className="h-5 w-5 text-primary" />
                <Badge variant={severityVariant(insight.severity)}>
                  {insight.severity.toLowerCase()}
                </Badge>
              </div>
              <div>
                <p className="text-lg font-semibold">{insight.metric}</p>
                <p className="mt-1 text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{insight.description}</p>
              </div>
              <div className="rounded-md bg-muted/60 p-2 text-xs">
                <p className="font-medium">{insight.recommendedAction}</p>
                <p className="mt-1 text-muted-foreground">
                  {formatStatus(insight.insightType)} | {insight.confidence}% confidence
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function InventoryWorkspace({ data }: { data: InventoryWarehouseOperationsData }) {
  return (
    <>
      <CapabilityGrid capabilities={data.capabilities} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ItemMasterCard items={data.items} />
        </div>
        <div className="xl:col-span-5">
          <TraceabilityCard records={data.traceability} />
        </div>
      </section>
      <StockLedgerCard entries={data.ledgerEntries} />
    </>
  );
}

function WarehouseWorkspace({ data }: { data: InventoryWarehouseOperationsData }) {
  return (
    <>
      <WarehouseGrid warehouses={data.warehouses} />
      <BinLocationCard bins={data.binLocations} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <GrnProcessingCard grns={data.grns} />
        </div>
        <div className="xl:col-span-6">
          <DispatchManagementCard dispatches={data.dispatches} />
        </div>
      </section>
      <MaterialMovementCard movements={data.materialMovements} />
    </>
  );
}

function CapabilityGrid({ capabilities }: { capabilities: InventoryCapability[] }) {
  return (
    <section>
      <SectionHeading
        badge={`${capabilities.length} capabilities`}
        description="Connected inventory workspaces with ownership, control state, and operating volume."
        title="Inventory operations"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {capabilities.map((capability) => (
          <div key={capability.key} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{capability.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{capability.description}</p>
              </div>
              <Badge variant={statusVariant(capability.status)}>
                {formatStatus(capability.status)}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {formatCompact(capability.openItems)} records | Owner {capability.ownerRole}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ItemMasterCard({ items }: { items: ItemMasterRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageSearch className="h-4 w-4 text-primary" />
          Item master and reorder levels
        </CardTitle>
        <CardDescription>
          Stock availability, coverage, reorder policy, valuation, and movement class
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">{item.name}</p>
                <Badge variant={movementClassVariant(item.movementClass)}>
                  {item.movementClass.toLowerCase()}
                </Badge>
                {item.available <= item.reorderLevel ? (
                  <Badge variant="danger">reorder</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.sku} | {formatStatus(item.itemType)} | {item.category} | {item.vendorName}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                On hand {formatCompact(item.onHand)} {item.uom} | Reserved{" "}
                {formatCompact(item.reserved)} | Reorder {formatCompact(item.reorderLevel)} |
                Safety {formatCompact(item.safetyStock)}
              </p>
            </div>
            <div className="text-sm md:text-right">
              <p className="font-semibold">{formatCompact(item.available)} available</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.coverageDays} days cover | {formatInr(item.stockValue)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.batchTracked ? "Batch" : ""}
                {item.batchTracked && item.serialTracked ? " + " : ""}
                {item.serialTracked ? "Serial" : ""}
                {!item.batchTracked && !item.serialTracked ? "Standard tracking" : " tracked"}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TraceabilityCard({ records }: { records: TraceabilityRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanBarcode className="h-4 w-4 text-primary" />
          Batch and serial tracking
        </CardTitle>
        <CardDescription>Lot lineage, unit history, expiry controls, and last movement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.map((record) => (
          <div key={record.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{record.traceNumber}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {record.itemSku} | {record.itemName}
                </p>
              </div>
              <Badge variant={record.traceType === "SERIAL" ? "info" : "success"}>
                {record.traceType.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {record.warehouse} / {record.binCode} | Qty {formatCompact(record.quantity)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatStatus(record.status)} | Last {record.lastMovement}
              {record.expiryDate ? ` | Exp ${formatShortDate(record.expiryDate)}` : ""}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StockLedgerCard({ entries }: { entries: StockLedgerEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Stock ledger
        </CardTitle>
        <CardDescription>
          Material inward, outward, transfer, and adjustment postings with valuation impact
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Movement</th>
              <th className="pb-2 pr-4 font-medium">Item</th>
              <th className="pb-2 pr-4 font-medium">Source to destination</th>
              <th className="pb-2 pr-4 text-right font-medium">Quantity</th>
              <th className="pb-2 pr-4 text-right font-medium">Value</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{entry.movementNumber}</p>
                  <p className="mt-1 text-muted-foreground">
                    {formatStatus(entry.movementType)} | {formatDate(entry.occurredAt)}
                  </p>
                </td>
                <td className="py-3 pr-4">
                  <p className="font-medium">{entry.itemName}</p>
                  <p className="mt-1 text-muted-foreground">
                    {entry.itemSku} | {entry.reference}
                  </p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {entry.source} to {entry.destination}
                </td>
                <td className="py-3 pr-4 text-right font-medium">
                  {formatCompact(entry.quantity)} {entry.uom}
                </td>
                <td className="py-3 pr-4 text-right font-medium">{formatInr(entry.value)}</td>
                <td className="py-3">
                  <Badge variant={statusVariant(entry.status)}>
                    {formatStatus(entry.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function WarehouseGrid({ warehouses }: { warehouses: WarehouseRecord[] }) {
  return (
    <section>
      <SectionHeading
        badge={`${warehouses.length} warehouses`}
        description="Facility health, capacity, manager ownership, GRN load, and outbound workload."
        title="Multiple warehouse control"
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <Warehouse className="h-5 w-5 text-primary" />
                <Badge variant={statusVariant(warehouse.status)}>
                  {formatStatus(warehouse.status)}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-semibold">{warehouse.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {warehouse.code} | {formatStatus(warehouse.warehouseType)}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    warehouse.utilizationPercent >= 90 ? "bg-red-500" : "bg-primary",
                  )}
                  style={{ width: `${warehouse.utilizationPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {warehouse.utilizationPercent}% utilized | {warehouse.binCount} bins
              </p>
              <p className="text-xs text-muted-foreground">
                {warehouse.location} | Manager {warehouse.manager}
              </p>
              <p className="text-xs text-muted-foreground">
                {warehouse.openGrns} GRNs | {warehouse.openDispatches} dispatches open
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function BinLocationCard({
  bins,
}: {
  bins: InventoryWarehouseOperationsData["binLocations"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          Bin locations
        </CardTitle>
        <CardDescription>
          Zone-level occupancy, controlled storage, and capacity threshold monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Warehouse / bin</th>
              <th className="pb-2 pr-4 font-medium">Zone</th>
              <th className="pb-2 pr-4 font-medium">Stored item</th>
              <th className="pb-2 pr-4 text-right font-medium">Occupancy</th>
              <th className="pb-2 pr-4 font-medium">Utilization</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {bins.map((bin) => (
              <tr key={bin.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{bin.warehouseCode}</p>
                  <p className="mt-1 text-muted-foreground">
                    {bin.binCode} | {formatStatus(bin.binType)}
                  </p>
                </td>
                <td className="py-3 pr-4 text-muted-foreground">{bin.zone}</td>
                <td className="py-3 pr-4">
                  <p className="font-medium">{bin.itemName}</p>
                  <p className="mt-1 text-muted-foreground">{bin.itemSku}</p>
                </td>
                <td className="py-3 pr-4 text-right font-medium">
                  {formatCompact(bin.occupiedUnits)} / {formatCompact(bin.capacityUnits)}
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          bin.utilizationPercent >= 90 ? "bg-red-500" : "bg-primary",
                        )}
                        style={{ width: `${bin.utilizationPercent}%` }}
                      />
                    </div>
                    <span>{bin.utilizationPercent}%</span>
                  </div>
                </td>
                <td className="py-3">
                  <Badge variant={statusVariant(bin.status)}>{formatStatus(bin.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function GrnProcessingCard({ grns }: { grns: GrnRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          GRN processing
        </CardTitle>
        <CardDescription>PO-linked inward receipts, quality state, and posting readiness</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {grns.map((grn) => (
          <div key={grn.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{grn.grnNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {grn.poNumber} | {grn.vendorName} | {grn.warehouseCode}
                </p>
              </div>
              <Badge variant={statusVariant(grn.status)}>{formatStatus(grn.status)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {grn.itemCount} items | Qty {formatCompact(grn.totalQuantity)} |{" "}
              {formatInr(grn.invoiceValue)} | {formatStatus(grn.qualityStatus)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DispatchManagementCard({ dispatches }: { dispatches: DispatchRecord[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Dispatch management
        </CardTitle>
        <CardDescription>Pick-pack status, carrier assignment, and outbound exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {dispatches.map((dispatch) => (
          <div key={dispatch.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{dispatch.dispatchNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dispatch.salesOrder} | {dispatch.customerName} | {dispatch.warehouseCode}
                </p>
              </div>
              <Badge variant={statusVariant(dispatch.status)}>
                {formatStatus(dispatch.status)}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Qty {formatCompact(dispatch.totalQuantity)} | {formatInr(dispatch.orderValue)} |{" "}
              {dispatch.carrier}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MaterialMovementCard({ movements }: { movements: MaterialMovementRecord[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
          Material movement tracking
        </CardTitle>
        <CardDescription>
          Transfer, put-away, picking, quality hold, and bin replenishment execution history
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {movements.map((movement) => (
          <div key={movement.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{movement.movementNumber}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatStatus(movement.movementType)}
                </p>
              </div>
              <Badge variant={statusVariant(movement.status)}>
                {formatStatus(movement.status)}
              </Badge>
            </div>
            <p className="mt-3 text-xs font-medium">
              {movement.itemName} | {formatCompact(movement.quantity)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {movement.fromLocation} to {movement.toLocation}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {movement.handledBy} | {formatDate(movement.occurredAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorkflowIntegration({ data }: { data: InventoryWarehouseOperationsData }) {
  return (
    <>
      <section>
        <SectionHeading
          badge="Workflow linked"
          description="Human approval, finance, vendor, and evidence controls embedded in inventory execution."
          title="Enterprise workflow integration"
        />
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <ApprovalQueue approvals={data.approvals} />
          </div>
          <div className="xl:col-span-5">
            <FinanceImpactCard impacts={data.financeImpacts} />
          </div>
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <VendorLinkageCard vendors={data.vendorLinks} />
        </div>
        <div className="xl:col-span-5">
          <AuditLogCard logs={data.auditLogs} />
        </div>
      </section>
    </>
  );
}

function ApprovalQueue({ approvals }: { approvals: InventoryApproval[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          Approval queue
        </CardTitle>
        <CardDescription>Maker-checker and control-gate decisions requiring action</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {approvals.map((approval) => (
          <div key={approval.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{approval.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {approval.reference} | {approval.workflow} | Owner {approval.ownerRole}
                </p>
              </div>
              <Badge variant={statusVariant(approval.status)}>
                {formatStatus(approval.status)}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {approval.impact} | Due {formatDate(approval.dueAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function FinanceImpactCard({ impacts }: { impacts: InventoryFinanceImpact[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-primary" />
          Finance impact
        </CardTitle>
        <CardDescription>Inventory valuation, blocked value, aging, and outbound exposure</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {impacts.map((impact) => (
          <div key={impact.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">{impact.label}</p>
              <Badge variant={impact.tone}>{formatInr(impact.amount)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{impact.context}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function VendorLinkageCard({ vendors }: { vendors: VendorLink[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers3 className="h-4 w-4 text-primary" />
          Vendor linkage
        </CardTitle>
        <CardDescription>
          Supplier exposure, replenishment lead time, delivery performance, and receipt state
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-xs">
          <thead className="text-muted-foreground">
            <tr className="border-b border-border">
              <th className="pb-2 pr-4 font-medium">Vendor</th>
              <th className="pb-2 pr-4 text-right font-medium">Linked SKUs</th>
              <th className="pb-2 pr-4 text-right font-medium">Lead time</th>
              <th className="pb-2 pr-4 text-right font-medium">OTD</th>
              <th className="pb-2 pr-4 text-right font-medium">Exposure</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b border-border/70 last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-semibold">{vendor.vendorName}</p>
                  <p className="mt-1 text-muted-foreground">
                    {vendor.vendorCode} | {vendor.openGrns} open GRNs
                  </p>
                </td>
                <td className="py-3 pr-4 text-right">{vendor.linkedSkus}</td>
                <td className="py-3 pr-4 text-right">{vendor.leadTimeDays} days</td>
                <td className="py-3 pr-4 text-right">{vendor.onTimeDelivery}%</td>
                <td className="py-3 pr-4 text-right font-medium">
                  {formatInr(vendor.exposure)}
                </td>
                <td className="py-3">
                  <Badge variant={statusVariant(vendor.status)}>
                    {formatStatus(vendor.status)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function AuditLogCard({ logs }: { logs: InventoryAuditEvent[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Audit logs
        </CardTitle>
        <CardDescription>Latest control evidence from people, rules, and ASTRA AI</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log) => (
          <div key={log.id} className="rounded-lg border border-border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{formatStatus(log.action)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {log.resource} | {log.reference}
                </p>
              </div>
              <Badge variant={severityVariant(log.severity)}>
                {log.severity.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {log.actor} | {formatDate(log.createdAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SectionHeading({
  badge,
  description,
  title,
}: {
  badge: string;
  description: string;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Badge variant="info">{badge}</Badge>
    </div>
  );
}

function statusVariant(status: string): BadgeVariant {
  if (
    [
      "ACTIVE",
      "COMPLETED",
      "CONTROLLED",
      "DISPATCHED",
      "PASSED",
      "POSTED",
      "RELEASED",
    ].includes(status)
  ) {
    return "success";
  }
  if (
    [
      "AGING_REVIEW",
      "ATTENTION",
      "EXPEDITE",
      "IN_TRANSIT",
      "PACKED",
      "PENDING",
      "PICKING",
      "PUTAWAY_PENDING",
      "RESERVED",
      "WAITING_APPROVAL",
    ].includes(status)
  ) {
    return "warning";
  }
  if (["BLOCKED", "EXCEPTION", "QUALITY_HOLD", "QUALITY_REVIEW"].includes(status)) {
    return "danger";
  }
  return "info";
}

function severityVariant(severity: string): BadgeVariant {
  if (severity === "CRITICAL" || severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  if (severity === "LOW") return "success";
  return "info";
}

function movementClassVariant(movementClass: ItemMasterRecord["movementClass"]): BadgeVariant {
  if (movementClass === "FAST") return "success";
  if (movementClass === "SLOW") return "warning";
  return "info";
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
    notation: Math.abs(amount) >= 1000000 ? "compact" : "standard",
  }).format(amount);
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
    notation: Math.abs(value) >= 1000 ? "compact" : "standard",
  }).format(value);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(iso));
}
