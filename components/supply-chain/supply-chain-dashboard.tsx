import {
  AlertTriangle,
  BarChart3,
  Boxes,
  ClipboardCheck,
  Factory,
  GitBranch,
  PackageCheck,
  PackageSearch,
  ShieldCheck,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import type {
  BomView,
  DispatchView,
  GoodsReceiptView,
  InventoryDashboardData,
  InventoryItemView,
  ProductionDashboardData,
  ProductionPlanView,
  QualityCheckView,
  StockMovementView,
  SupplyChainAiAlertView,
  SupplyChainAuditView,
  WarehouseView,
} from "@/lib/supply-chain/types";

export function InventoryDashboard({ data }: { data: InventoryDashboardData }) {
  return (
    <div className="space-y-6">
      <SupplyChainHeader
        eyebrow="Supply chain operations"
        title="Inventory command center"
        description="Warehouse inventory, stock movements, GRNs, dispatch readiness, inventory analytics, AI alerts, and control logs."
      />
      <StatsGrid
        data={data.stats}
        icons={[Warehouse, BarChart3, PackageSearch, AlertTriangle]}
      />
      <InventoryAnalytics data={data} />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <WarehousesCard warehouses={data.warehouses} />
        </div>
        <div className="xl:col-span-7">
          <InventoryItemsCard items={data.items} />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <StockMovementsCard movements={data.movements} />
        </div>
        <div className="space-y-4 xl:col-span-5">
          <AiAlertsCard alerts={data.alerts} />
          <QualityChecksCard checks={data.qualityChecks} compact />
        </div>
      </section>
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-6">
          <GoodsReceiptsCard grns={data.grns} />
        </div>
        <div className="xl:col-span-6">
          <DispatchesCard dispatches={data.dispatches} />
        </div>
      </section>
      <AuditCard logs={data.auditLogs} />
    </div>
  );
}

export function ProductionDashboard({ data }: { data: ProductionDashboardData }) {
  return (
    <div className="space-y-6">
      <SupplyChainHeader
        eyebrow="Manufacturing operations"
        title="Production command center"
        description="BOM governance, production planning, shop-floor execution, quality control, AI exceptions, and audit traceability."
      />
      <StatsGrid
        data={data.stats}
        icons={[GitBranch, Factory, BarChart3, ClipboardCheck]}
      />
      <section className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <ProductionPlansCard plans={data.productionPlans} />
        </div>
        <div className="space-y-4 xl:col-span-5">
          <AiAlertsCard alerts={data.alerts} />
          <QualityChecksCard checks={data.qualityChecks} compact />
        </div>
      </section>
      <BomsCard boms={data.boms} />
      <AuditCard logs={data.auditLogs} />
    </div>
  );
}

function SupplyChainHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <p className="text-sm text-muted-foreground">{eyebrow}</p>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

function StatsGrid({
  data,
  icons,
}: {
  data: InventoryDashboardData["stats"];
  icons: LucideIcon[];
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {data.map((item, index) => (
        <StatCard
          key={item.label}
          label={item.label}
          value={item.value}
          change={item.change}
          trend={item.trend}
          icon={icons[index] ?? Boxes}
        />
      ))}
    </section>
  );
}

function InventoryAnalytics({ data }: { data: InventoryDashboardData }) {
  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <Metric label="Stock value" value={formatInr(data.analytics.stockValue)} />
      <Metric label="Available units" value={formatCompact(data.analytics.availableUnits)} />
      <Metric label="Reserved units" value={formatCompact(data.analytics.reservedUnits)} />
      <Metric label="Reorder items" value={String(data.analytics.reorderItemCount)} />
      <Metric label="GRN holds" value={String(data.analytics.qualityHoldCount)} />
      <Metric label="Dispatch exceptions" value={String(data.analytics.dispatchExceptionCount)} />
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function WarehousesCard({ warehouses }: { warehouses: WarehouseView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-4 w-4 text-primary" />
          Warehouses
        </CardTitle>
        <CardDescription>Capacity, utilization, and warehouse operating state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {warehouses.length === 0 ? (
          <EmptyState icon={Warehouse} title="No warehouses" description="Warehouse masters will appear here." />
        ) : (
          warehouses.map((warehouse) => (
            <div key={warehouse.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{warehouse.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {warehouse.code} | {warehouse.location ?? "No location"}
                  </p>
                </div>
                <Badge variant={statusVariant(warehouse.status)}>
                  {formatStatus(warehouse.status)}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Utilization {formatPercent(warehouse.utilizationPercent)} | Capacity{" "}
                {warehouse.capacityUnits == null
                  ? "not set"
                  : formatCompact(warehouse.capacityUnits)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function InventoryItemsCard({ items }: { items: InventoryItemView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageSearch className="h-4 w-4 text-primary" />
          Inventory items
        </CardTitle>
        <CardDescription>Stock position, reorder thresholds, and valuation drivers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={PackageSearch} title="No item masters" description="Inventory item records will appear here." />
        ) : (
          items.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{item.name}</p>
                  <Badge variant={itemStatusVariant(item)}>{formatStatus(item.itemType)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.sku} | {item.category ?? "Uncategorized"} | {item.uom}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  On hand {formatCompact(item.onHandStock)} | Reserved{" "}
                  {formatCompact(item.reservedStock)} | Reorder{" "}
                  {formatCompact(item.reorderPoint)}
                </p>
              </div>
              <div className="text-sm md:text-right">
                <p className="font-semibold">{formatCompact(item.availableStock)} available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.standardCost == null ? "No cost" : formatInr(item.standardCost)}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StockMovementsCard({ movements }: { movements: StockMovementView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PackageCheck className="h-4 w-4 text-primary" />
          Stock movement
        </CardTitle>
        <CardDescription>Receipts, issues, dispatches, adjustments, and production postings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {movements.length === 0 ? (
          <EmptyState icon={PackageCheck} title="No stock movements" description="Posted inventory movements will appear here." />
        ) : (
          movements.map((movement) => (
            <div key={movement.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{movement.itemName}</p>
                  <Badge variant={movementVariant(movement.movementType)}>
                    {formatStatus(movement.movementType)}
                  </Badge>
                  <Badge variant={statusVariant(movement.status)}>
                    {formatStatus(movement.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {movement.movementNumber} | {movement.itemSku} | {movement.warehouseName}
                </p>
              </div>
              <div className="text-sm md:text-right">
                <p className="font-semibold">{formatCompact(movement.quantity)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {movement.referenceNumber ?? movement.referenceType ?? "No reference"}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function GoodsReceiptsCard({ grns }: { grns: GoodsReceiptView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>GRN</CardTitle>
        <CardDescription>Goods receipt notes and inbound quality state</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {grns.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No GRNs" description="Inbound goods receipt activity will appear here." />
        ) : (
          grns.map((grn) => (
            <div key={grn.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{grn.supplierName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {grn.grnNumber} | {grn.poNumber ?? "No PO"} | {grn.warehouseName}
                  </p>
                </div>
                <Badge variant={statusVariant(grn.status)}>{formatStatus(grn.status)}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {grn.itemCount} items | Qty {formatCompact(grn.totalQuantity)} |{" "}
                {grn.qualityStatus ?? "Quality not started"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DispatchesCard({ dispatches }: { dispatches: DispatchView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          Dispatch
        </CardTitle>
        <CardDescription>Outbound customer dispatches and delivery exceptions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {dispatches.length === 0 ? (
          <EmptyState icon={Truck} title="No dispatches" description="Outbound dispatch activity will appear here." />
        ) : (
          dispatches.map((dispatch) => (
            <div key={dispatch.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{dispatch.customerName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dispatch.dispatchNumber} | {dispatch.orderNumber ?? "No order"} |{" "}
                    {dispatch.warehouseName}
                  </p>
                </div>
                <Badge variant={statusVariant(dispatch.status)}>
                  {formatStatus(dispatch.status)}
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {dispatch.itemCount} items | Qty {formatCompact(dispatch.totalQuantity)} |{" "}
                {dispatch.carrier ?? "Carrier pending"}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ProductionPlansCard({ plans }: { plans: ProductionPlanView[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-primary" />
          Production planning
        </CardTitle>
        <CardDescription>Plan release, capacity commitment, and output progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {plans.length === 0 ? (
          <EmptyState icon={Factory} title="No production plans" description="Planned and released production orders will appear here." />
        ) : (
          plans.map((plan) => (
            <div key={plan.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{plan.name}</p>
                  <Badge variant={statusVariant(plan.status)}>{formatStatus(plan.status)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.planNumber} | {plan.outputItemName} | {plan.bomNumber ?? "No BOM"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {plan.warehouseName ?? "No warehouse"} | Owner {formatRole(plan.ownerRole)}
                </p>
              </div>
              <div className="text-sm md:text-right">
                <p className="font-semibold">
                  {formatCompact(plan.completedQuantity)} / {formatCompact(plan.plannedQuantity)}{" "}
                  {plan.uom}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {plan.scheduledStart ? formatDate(plan.scheduledStart) : "Unscheduled"}
                </p>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BomsCard({ boms }: { boms: BomView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          BOM
        </CardTitle>
        <CardDescription>Bill of material structure, components, and yield controls</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-2">
        {boms.length === 0 ? (
          <EmptyState icon={GitBranch} title="No BOM records" description="Configured bills of material will appear here." />
        ) : (
          boms.map((bom) => (
            <div key={bom.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{bom.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bom.bomNumber} | v{bom.version} | {bom.outputSku}
                  </p>
                </div>
                <Badge variant={statusVariant(bom.status)}>{formatStatus(bom.status)}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Output {formatCompact(bom.yieldQuantity)} {bom.uom} | {bom.componentCount} components
              </p>
              <div className="mt-3 space-y-2">
                {bom.components.slice(0, 3).map((component) => (
                  <div key={component.id} className="flex justify-between gap-3 text-xs">
                    <span className="min-w-0 truncate">
                      {component.componentName} ({component.componentSku})
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatCompact(component.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function QualityChecksCard({
  checks,
  compact = false,
}: {
  checks: QualityCheckView[];
  compact?: boolean;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Quality control
        </CardTitle>
        <CardDescription>Incoming and production quality checks</CardDescription>
      </CardHeader>
      <CardContent className={compact ? "space-y-3" : "grid gap-3 md:grid-cols-2"}>
        {checks.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No quality checks" description="QC inspections and holds will appear here." />
        ) : (
          checks.map((check) => (
            <div key={check.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{check.checkType}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {check.checkNumber} | {check.itemName ?? check.planNumber ?? check.grnNumber ?? "Control"}
                  </p>
                </div>
                <Badge variant={statusVariant(check.status)}>{formatStatus(check.status)}</Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Sample {check.sampleSize == null ? "n/a" : formatCompact(check.sampleSize)} |{" "}
                Defects {check.defectCount} | Owner {formatRole(check.inspectorRole)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AiAlertsCard({ alerts }: { alerts: SupplyChainAiAlertView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          AI alerts
        </CardTitle>
        <CardDescription>Inventory and production risk signals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <EmptyState icon={AlertTriangle} title="No active AI alerts" description="Supply-chain exception signals will appear here." />
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold">{alert.title}</p>
                <Badge variant={severityVariant(alert.severity)}>
                  {alert.severity.toLowerCase()}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{alert.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {formatStatus(alert.alertType)}
                {alert.confidence == null
                  ? ""
                  : ` | ${Math.round(alert.confidence)}% confidence`}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AuditCard({ logs }: { logs: SupplyChainAuditView[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Audit logs
        </CardTitle>
        <CardDescription>Inventory and production control events</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {logs.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No audit events" description="Control and exception audit events will appear here." />
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-1 text-sm font-semibold">
                    {formatStatus(log.action)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.resource} | {formatDate(log.createdAt)}
                  </p>
                </div>
                <Badge variant={severityVariant(log.severity)}>
                  {log.severity.toLowerCase()}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function itemStatusVariant(
  item: InventoryItemView,
): "default" | "success" | "warning" | "danger" | "info" {
  if (item.availableStock <= Math.max(item.reorderPoint, item.safetyStock)) return "danger";
  if (item.itemType === "FINISHED_GOOD") return "success";
  return "info";
}

function statusVariant(status: string): "default" | "success" | "warning" | "danger" | "info" {
  if (["ACTIVE", "POSTED", "PASSED", "DELIVERED", "COMPLETED"].includes(status)) {
    return "success";
  }
  if (["PLANNED", "PICKING", "PACKED", "RECEIVED", "RELEASED", "IN_PROGRESS", "PENDING", "REWORK"].includes(status)) {
    return "warning";
  }
  if (["HOLD", "QUALITY_HOLD", "FAILED", "BLOCKED", "EXCEPTION", "CANCELLED", "REVERSED"].includes(status)) {
    return "danger";
  }
  return "info";
}

function movementVariant(type: string): "default" | "success" | "warning" | "danger" | "info" {
  if (["RECEIPT", "GRN", "PRODUCTION_OUTPUT", "RETURN"].includes(type)) return "success";
  if (["ISSUE", "DISPATCH", "PRODUCTION_CONSUMPTION"].includes(type)) return "warning";
  if (type === "ADJUSTMENT") return "info";
  return "default";
}

function severityVariant(severity: string): "default" | "success" | "warning" | "danger" | "info" {
  if (severity === "CRITICAL" || severity === "HIGH" || severity === "ERROR") return "danger";
  if (severity === "MEDIUM" || severity === "WARNING") return "warning";
  if (severity === "INFO") return "info";
  return "success";
}

function formatStatus(value: string): string {
  return value
    .toLowerCase()
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatRole(role: string | null): string {
  return role ? formatStatus(role) : "Unassigned";
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

function formatPercent(value: number | null): string {
  return value == null ? "n/a" : `${Math.round(value)}%`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
