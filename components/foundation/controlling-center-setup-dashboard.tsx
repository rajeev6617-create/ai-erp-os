"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  Landmark,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Target,
} from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, getApiErrorMessage, type ApiEnvelope } from "@/lib/api/client";
import type {
  ControllingCenterStatusValue,
  ControllingCompanyOption,
  ControllingDepartmentOption,
  ControllingLocationOption,
  ControllingUserOption,
  CostCenterRecord,
  CostCenterTypeValue,
  ProfitCenterRecord,
} from "@/lib/foundation/controlling-center";

type CenterKind = "cost" | "profit";
type FormMode = "view" | "edit" | "create";

type CenterRecord = {
  id: string;
  companyId: string;
  companyCode: string;
  companyName: string;
  locationId: string | null;
  locationCode: string | null;
  locationName: string | null;
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  centerCode: string;
  centerName: string;
  centerType: CostCenterTypeValue | null;
  businessSegment: string | null;
  responsibleUserId: string | null;
  responsibleUserName: string | null;
  validFrom: string;
  validTo: string | null;
  status: ControllingCenterStatusValue;
  createdAt: string;
};

type CenterFormState = {
  companyId: string;
  locationId: string;
  departmentId: string;
  centerCode: string;
  centerName: string;
  centerType: CostCenterTypeValue;
  businessSegment: string;
  responsibleUserId: string;
  validFrom: string;
  validTo: string;
  status: ControllingCenterStatusValue;
};

type CenterFieldErrors = Partial<Record<keyof CenterFormState, string>>;

type CenterOptions = {
  companies: ControllingCompanyOption[];
  locations: ControllingLocationOption[];
  departments: ControllingDepartmentOption[];
  users: ControllingUserOption[];
};

const COST_CENTER_TYPES: CostCenterTypeValue[] = [
  "ADMIN",
  "FINANCE",
  "PURCHASE",
  "SALES",
  "PRODUCTION",
  "QUALITY",
  "MAINTENANCE",
  "HR",
  "IT",
  "OTHER",
];
const CENTER_STATUSES: ControllingCenterStatusValue[] = ["ACTIVE", "INACTIVE"];

export function ControllingCenterSetupDashboard({
  kind,
  initialCenters,
  initialCompanies,
  initialLocations,
  initialDepartments = [],
  initialUsers,
  canManage,
  organizationName,
}: {
  kind: CenterKind;
  initialCenters: Array<CostCenterRecord | ProfitCenterRecord>;
  initialCompanies: ControllingCompanyOption[];
  initialLocations: ControllingLocationOption[];
  initialDepartments?: ControllingDepartmentOption[];
  initialUsers: ControllingUserOption[];
  canManage: boolean;
  organizationName: string;
}) {
  const config = centerConfig(kind);
  const normalizedCenters = initialCenters.map((center) =>
    normalizeCenterRecord(kind, center),
  );
  const firstCenter = normalizedCenters[0] ?? null;
  const [centers, setCenters] = useState(sortCenters(normalizedCenters));
  const [options, setOptions] = useState<CenterOptions>({
    companies: initialCompanies,
    locations: initialLocations,
    departments: initialDepartments,
    users: initialUsers,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | CostCenterTypeValue>(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | ControllingCenterStatusValue
  >("ALL");
  const [mode, setMode] = useState<FormMode>(
    firstCenter
      ? "view"
      : canManage && activeCompanies(initialCompanies).length > 0
        ? "create"
        : "view",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    firstCenter?.id ?? null,
  );
  const [form, setForm] = useState<CenterFormState>(
    firstCenter ? toFormState(firstCenter) : emptyFormState(initialCompanies),
  );
  const [fieldErrors, setFieldErrors] = useState<CenterFieldErrors>({});
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { showToast } = useToast();

  const selectedCenter = useMemo(
    () => centers.find((center) => center.id === selectedId) ?? null,
    [centers, selectedId],
  );
  const companyLocations = useMemo(
    () =>
      options.locations.filter(
        (location) => location.companyId === form.companyId,
      ),
    [form.companyId, options.locations],
  );
  const companyDepartments = useMemo(
    () =>
      options.departments.filter(
        (department) => department.companyId === form.companyId,
      ),
    [form.companyId, options.departments],
  );
  const filteredCenters = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return centers.filter((center) => {
      if (companyFilter !== "ALL" && center.companyId !== companyFilter) {
        return false;
      }
      if (kind === "cost" && typeFilter !== "ALL" && center.centerType !== typeFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && center.status !== statusFilter) return false;
      if (!query) return true;

      return [
        center.centerCode,
        center.centerName,
        center.centerType ?? "",
        center.businessSegment ?? "",
        center.companyCode,
        center.companyName,
        center.locationCode ?? "",
        center.locationName ?? "",
        center.departmentCode ?? "",
        center.departmentName ?? "",
        center.responsibleUserName ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [centers, companyFilter, kind, searchQuery, statusFilter, typeFilter]);

  async function refreshList() {
    setLoadingList(true);
    const result = await apiFetch<
      {
        items: Array<CostCenterRecord | ProfitCenterRecord>;
        companies: ControllingCompanyOption[];
        locations: ControllingLocationOption[];
        departments?: ControllingDepartmentOption[];
        users: ControllingUserOption[];
      }
    >(config.apiPath);
    setLoadingList(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, `Unable to refresh ${config.pluralLower}.`),
      });
      return;
    }

    const nextCenters = sortCenters(
      result.data.items.map((center) => normalizeCenterRecord(kind, center)),
    );
    setCenters(nextCenters);
    setOptions({
      companies: result.data.companies,
      locations: result.data.locations,
      departments: result.data.departments ?? [],
      users: result.data.users,
    });

    if (!selectedId && nextCenters.length > 0) {
      setSelectedId(nextCenters[0].id);
      if (mode !== "create") {
        setMode("view");
        setForm(toFormState(nextCenters[0]));
      }
      return;
    }

    if (selectedId) {
      const current = nextCenters.find((center) => center.id === selectedId);
      if (current && mode !== "create") setForm(toFormState(current));
    }
  }

  async function loadCenterDetail(id: string, nextMode: FormMode) {
    setLoadingDetail(true);
    const result = await apiFetch<CostCenterRecord | ProfitCenterRecord>(
      `${config.apiPath}/${id}`,
    );
    setLoadingDetail(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, `Unable to load ${config.singularLower}.`),
      });
      return;
    }

    const nextRecord = normalizeCenterRecord(kind, result.data);
    setCenters((current) =>
      sortCenters([
        nextRecord,
        ...current.filter((center) => center.id !== nextRecord.id),
      ]),
    );
    setSelectedId(nextRecord.id);
    setMode(nextMode);
    setForm(toFormState(nextRecord));
    setFieldErrors({});
  }

  function beginCreate() {
    if (activeCompanies(options.companies).length === 0) {
      showToast({
        variant: "error",
        message: `Create or activate a company before adding a ${config.singularLower}.`,
      });
      return;
    }
    setMode("create");
    setSelectedId(null);
    setForm(emptyFormState(options.companies));
    setFieldErrors({});
  }

  function cancelEdit() {
    if (selectedCenter) {
      setMode("view");
      setForm(toFormState(selectedCenter));
    } else if (canManage && activeCompanies(options.companies).length > 0) {
      beginCreate();
    }
    setFieldErrors({});
  }

  function updateField<K extends keyof CenterFormState>(
    field: K,
    value: CenterFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateCompany(companyId: string) {
    setForm((current) => ({
      ...current,
      companyId,
      locationId: options.locations.some(
        (location) =>
          location.id === current.locationId && location.companyId === companyId,
      )
        ? current.locationId
        : "",
      departmentId: options.departments.some(
        (department) =>
          department.id === current.departmentId &&
          department.companyId === companyId,
      )
        ? current.departmentId
        : "",
    }));
    setFieldErrors((current) => ({
      ...current,
      companyId: undefined,
      locationId: undefined,
      departmentId: undefined,
    }));
  }

  function validateForm(): CenterFieldErrors {
    const errors: CenterFieldErrors = {};
    const payload = normalizeForm(form);

    if (!payload.companyId) errors.companyId = "Company is required";
    if (!payload.centerCode) {
      errors.centerCode = `${config.singular} code is required`;
    } else if (!/^[A-Z0-9_-]+$/.test(payload.centerCode)) {
      errors.centerCode = "Use only letters, numbers, hyphen, and underscore";
    }
    if (!payload.centerName) {
      errors.centerName = `${config.singular} name is required`;
    }
    if (kind === "cost" && !payload.centerType) {
      errors.centerType = "Cost center type is required";
    }
    if (!payload.validFrom) errors.validFrom = "Valid from is required";
    if (payload.validFrom && payload.validTo && payload.validTo < payload.validFrom) {
      errors.validTo = "Valid to cannot be before valid from";
    }

    const company = options.companies.find(
      (item) => item.id === payload.companyId,
    );
    if (!company) {
      errors.companyId = "Select a valid company";
    } else if (
      company.status !== "ACTIVE" &&
      payload.companyId !== selectedCenter?.companyId
    ) {
      errors.companyId = "Select an active company";
    }

    if (payload.locationId) {
      const location = options.locations.find(
        (item) => item.id === payload.locationId,
      );
      if (!location || location.companyId !== payload.companyId) {
        errors.locationId = "Select a location under the chosen company";
      } else if (
        location.status !== "ACTIVE" &&
        payload.locationId !== selectedCenter?.locationId
      ) {
        errors.locationId = "Select an active location";
      }
    }

    if (kind === "cost" && payload.departmentId) {
      const department = options.departments.find(
        (item) => item.id === payload.departmentId,
      );
      if (!department || department.companyId !== payload.companyId) {
        errors.departmentId = "Select a department under the chosen company";
      } else if (
        department.status !== "ACTIVE" &&
        payload.departmentId !== selectedCenter?.departmentId
      ) {
        errors.departmentId = "Select an active department";
      }
    }

    if (
      payload.responsibleUserId &&
      !options.users.some((user) => user.id === payload.responsibleUserId)
    ) {
      errors.responsibleUserId = "Select a user from this organization";
    }

    if (
      centers.some(
        (center) =>
          center.centerCode.toUpperCase() === payload.centerCode &&
          center.id !== selectedId,
      )
    ) {
      errors.centerCode = `This ${config.singularLower} code already exists`;
    }

    return errors;
  }

  async function saveCenter() {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast({
        variant: "error",
        message: "Please correct the highlighted fields before saving.",
      });
      return;
    }

    setSaving(true);
    const endpoint =
      mode === "edit" && selectedId
        ? `${config.apiPath}/${selectedId}`
        : config.apiPath;
    const method = mode === "edit" && selectedId ? "PATCH" : "POST";
    const result = await apiFetch<CostCenterRecord | ProfitCenterRecord>(
      endpoint,
      {
        method,
        body: JSON.stringify(toApiPayload(kind, normalizeForm(form))),
      },
    );
    setSaving(false);

    if (!result.success || !result.data) {
      const errorsFromServer = extractFieldErrors(kind, result);
      mapDomainError(kind, result, errorsFromServer);
      if (Object.keys(errorsFromServer).length > 0) {
        setFieldErrors(errorsFromServer);
      }
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, `Unable to save ${config.singularLower}.`),
      });
      return;
    }

    const saved = normalizeCenterRecord(kind, result.data);
    setCenters((current) =>
      sortCenters([saved, ...current.filter((center) => center.id !== saved.id)]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    setFieldErrors({});
    await refreshList();
    showToast({
      variant: "success",
      message: mode === "edit" ? `${config.singular} updated.` : `${config.singular} created.`,
    });
  }

  async function deactivateCenter(targetId?: string) {
    const id = targetId ?? selectedId;
    if (!id) return;

    setDeactivating(true);
    const result = await apiFetch<CostCenterRecord | ProfitCenterRecord>(
      `${config.apiPath}/${id}`,
      { method: "DELETE" },
    );
    setDeactivating(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, `Unable to deactivate ${config.singularLower}.`),
      });
      return;
    }

    const saved = normalizeCenterRecord(kind, result.data);
    setCenters((current) =>
      sortCenters([saved, ...current.filter((center) => center.id !== saved.id)]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    showToast({ variant: "success", message: `${config.singular} deactivated.` });
  }

  const Icon = kind === "cost" ? Landmark : Target;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Foundation / Controlling</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {config.plural}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.description} for {organizationName}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!canManage ? <Badge variant="info">View only</Badge> : null}
          <Button type="button" variant="outline" onClick={refreshList} disabled={loadingList}>
            {loadingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          {canManage ? (
            <Button type="button" onClick={beginCreate}>
              <Plus className="h-4 w-4" />
              Create {config.singular}
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>{config.singular} Register</CardTitle>
                <CardDescription>
                  Search, filter, and maintain controlling assignments under each legal entity.
                </CardDescription>
              </div>
              <Badge variant="default">{centers.length} total</Badge>
            </div>
            <div className="grid gap-2 pt-3 lg:grid-cols-3">
              <label className="relative lg:col-span-3">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={`Search ${config.pluralLower}, company, location, or owner`}
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </label>
              <FilterSelect
                value={companyFilter}
                onChange={setCompanyFilter}
                options={[
                  { label: "All companies", value: "ALL" },
                  ...options.companies.map((company) => ({
                    label: `${company.companyCode} - ${company.companyName}`,
                    value: company.id,
                  })),
                ]}
              />
              {kind === "cost" ? (
                <FilterSelect
                  value={typeFilter}
                  onChange={(value) => setTypeFilter(value as "ALL" | CostCenterTypeValue)}
                  options={[
                    { label: "All types", value: "ALL" },
                    ...COST_CENTER_TYPES.map((type) => ({
                      label: typeLabel(type),
                      value: type,
                    })),
                  ]}
                />
              ) : null}
              <FilterSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as "ALL" | ControllingCenterStatusValue)}
                options={[
                  { label: "All statuses", value: "ALL" },
                  ...CENTER_STATUSES.map((status) => ({ label: status, value: status })),
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loadingList && centers.length === 0 ? (
              <LoadingRows />
            ) : filteredCenters.length === 0 ? (
              <EmptyState
                icon={Icon}
                title={`No ${config.singularLower} records found`}
                description={
                  searchQuery || companyFilter !== "ALL" || typeFilter !== "ALL" || statusFilter !== "ALL"
                    ? "Try a different search or filter."
                    : canManage
                      ? `Create your first ${config.singularLower} for an active company.`
                      : `No ${config.singularLower} records are available yet.`
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">{config.singular}</th>
                      <th className="px-2 py-2">Scope</th>
                      <th className="px-2 py-2">{kind === "cost" ? "Type" : "Segment"}</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCenters.map((center) => (
                      <tr
                        key={center.id}
                        className={`border-b border-border/60 ${selectedId === center.id ? "bg-muted/40" : ""}`}
                      >
                        <td className="px-2 py-3 font-semibold">{center.centerCode}</td>
                        <td className="px-2 py-3">
                          <p className="font-medium">{center.centerName}</p>
                          <p className="text-xs text-muted-foreground">
                            Valid {center.validFrom}{center.validTo ? ` to ${center.validTo}` : " onward"}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <p className="text-xs font-medium">{center.companyCode}</p>
                          <p className="text-xs text-muted-foreground">{center.locationCode ?? "Company-wide"}</p>
                        </td>
                        <td className="px-2 py-3">
                          {kind === "cost" ? (
                            <Badge variant="info">{typeLabel(center.centerType ?? "OTHER")}</Badge>
                          ) : (
                            <span className="text-xs">{center.businessSegment ?? "Not assigned"}</span>
                          )}
                        </td>
                        <td className="px-2 py-3"><StatusBadge status={center.status} /></td>
                        <td className="px-2 py-3">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="sm" onClick={() => loadCenterDetail(center.id, "view")}>
                              <Eye className="h-4 w-4" /> View
                            </Button>
                            {canManage ? (
                              <Button type="button" variant="ghost" size="sm" onClick={() => loadCenterDetail(center.id, "edit")}>
                                <Pencil className="h-4 w-4" /> Edit
                              </Button>
                            ) : null}
                            {canManage && center.status === "ACTIVE" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(center.id);
                                  setForm(toFormState(center));
                                  setMode("view");
                                  void deactivateCenter(center.id);
                                }}
                                disabled={deactivating}
                              >
                                <Power className="h-4 w-4" /> Deactivate
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader>
            <CardTitle>
              {mode === "create" ? `Create ${config.singular}` : mode === "edit" ? `Edit ${config.singular}` : `View ${config.singular}`}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Enter organizational scope, accountability, and validity details."
                : selectedCenter
                  ? `${selectedCenter.centerCode} - ${selectedCenter.centerName}`
                  : `Select a ${config.singularLower} from the table to view details.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingDetail ? (
              <LoadingRows />
            ) : mode !== "create" && !selectedCenter ? (
              <EmptyState icon={Icon} title={`No ${config.singularLower} selected`} description="Pick a row from the register to inspect its details." />
            ) : (
              <>
                <SelectField
                  label="Company / Legal Entity"
                  value={form.companyId}
                  options={options.companies.map((company) => ({
                    label: `${company.companyCode} - ${company.companyName}${company.status === "INACTIVE" ? " (Inactive)" : ""}`,
                    value: company.id,
                    disabled: company.status === "INACTIVE" && company.id !== selectedCenter?.companyId,
                  }))}
                  onChange={updateCompany}
                  error={fieldErrors.companyId}
                  disabled={!canManage || mode === "view"}
                />
                <SelectField
                  label="Location / Plant (Optional)"
                  value={form.locationId}
                  placeholder="Company-wide assignment"
                  options={companyLocations.map((location) => ({
                    label: `${location.locationCode} - ${location.locationName}${location.status === "INACTIVE" ? " (Inactive)" : ""}`,
                    value: location.id,
                    disabled: location.status === "INACTIVE" && location.id !== selectedCenter?.locationId,
                  }))}
                  onChange={(value) => updateField("locationId", value)}
                  error={fieldErrors.locationId}
                  disabled={!canManage || mode === "view"}
                />
                {kind === "cost" ? (
                  <SelectField
                    label="Department (Optional)"
                    value={form.departmentId}
                    placeholder="No department assignment"
                    options={companyDepartments.map((department) => ({
                      label: `${department.departmentCode} - ${department.departmentName}${department.status === "INACTIVE" ? " (Inactive)" : ""}`,
                      value: department.id,
                      disabled: department.status === "INACTIVE" && department.id !== selectedCenter?.departmentId,
                    }))}
                    onChange={(value) => updateField("departmentId", value)}
                    error={fieldErrors.departmentId}
                    disabled={!canManage || mode === "view"}
                  />
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label={`${config.singular} Code`} value={form.centerCode} onChange={(value) => updateField("centerCode", value.toUpperCase())} error={fieldErrors.centerCode} disabled={!canManage || mode === "view"} />
                  {kind === "cost" ? (
                    <SelectField label="Cost Center Type" value={form.centerType} options={COST_CENTER_TYPES.map((type) => ({ label: typeLabel(type), value: type }))} onChange={(value) => updateField("centerType", value as CostCenterTypeValue)} error={fieldErrors.centerType} disabled={!canManage || mode === "view"} />
                  ) : (
                    <FormField label="Business Segment (Optional)" value={form.businessSegment} onChange={(value) => updateField("businessSegment", value)} error={fieldErrors.businessSegment} disabled={!canManage || mode === "view"} />
                  )}
                  <FormField label={`${config.singular} Name`} value={form.centerName} onChange={(value) => updateField("centerName", value)} error={fieldErrors.centerName} disabled={!canManage || mode === "view"} />
                  <SelectField label="Status" value={form.status} options={CENTER_STATUSES.map((status) => ({ label: status, value: status }))} onChange={(value) => updateField("status", value as ControllingCenterStatusValue)} error={fieldErrors.status} disabled={!canManage || mode === "view"} />
                  <FormField label="Valid From" type="date" value={form.validFrom} onChange={(value) => updateField("validFrom", value)} error={fieldErrors.validFrom} disabled={!canManage || mode === "view"} />
                  <FormField label="Valid To (Optional)" type="date" value={form.validTo} onChange={(value) => updateField("validTo", value)} error={fieldErrors.validTo} disabled={!canManage || mode === "view"} />
                </div>
                {options.users.length > 0 ? (
                  <SelectField
                    label="Responsible User (Optional)"
                    value={form.responsibleUserId}
                    placeholder="No responsible user assigned"
                    options={options.users.map((user) => ({ label: `${user.name} - ${user.email}`, value: user.id }))}
                    onChange={(value) => updateField("responsibleUserId", value)}
                    error={fieldErrors.responsibleUserId}
                    disabled={!canManage || mode === "view"}
                  />
                ) : null}
                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                  {mode !== "view" ? <Button type="button" variant="outline" onClick={cancelEdit} disabled={saving}>Cancel</Button> : null}
                  {canManage && mode === "view" && selectedCenter ? <Button type="button" variant="outline" onClick={() => setMode("edit")}><Pencil className="h-4 w-4" /> Edit</Button> : null}
                  {canManage && mode !== "view" ? <Button type="button" onClick={saveCenter} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}{mode === "edit" ? "Save Changes" : `Create ${config.singular}`}</Button> : null}
                  {canManage && mode === "view" && selectedCenter?.status === "ACTIVE" ? <Button type="button" variant="danger" onClick={() => deactivateCenter()} disabled={deactivating}>{deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}Deactivate</Button> : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function centerConfig(kind: CenterKind) {
  return kind === "cost"
    ? {
        singular: "Cost Center",
        singularLower: "cost center",
        plural: "Cost Centers",
        pluralLower: "cost centers",
        apiPath: "/api/foundation/cost-centers",
        description: "Maintain cost ownership for controlling, budgeting, and operational accountability",
      }
    : {
        singular: "Profit Center",
        singularLower: "profit center",
        plural: "Profit Centers",
        pluralLower: "profit centers",
        apiPath: "/api/foundation/profit-centers",
        description: "Maintain revenue and profitability responsibility for management reporting",
      };
}

function normalizeCenterRecord(
  kind: CenterKind,
  center: CostCenterRecord | ProfitCenterRecord,
): CenterRecord {
  if (kind === "cost" && "costCenterCode" in center) {
    return {
      ...center,
      centerCode: center.costCenterCode,
      centerName: center.costCenterName,
      centerType: center.costCenterType,
      businessSegment: null,
    };
  }
  const profitCenter = center as ProfitCenterRecord;
  return {
    ...profitCenter,
    departmentId: null,
    departmentCode: null,
    departmentName: null,
    centerCode: profitCenter.profitCenterCode,
    centerName: profitCenter.profitCenterName,
    centerType: null,
  };
}

function normalizeForm(form: CenterFormState): CenterFormState {
  return {
    companyId: form.companyId.trim(),
    locationId: form.locationId.trim(),
    departmentId: form.departmentId.trim(),
    centerCode: form.centerCode.trim().toUpperCase(),
    centerName: form.centerName.trim(),
    centerType: form.centerType,
    businessSegment: form.businessSegment.trim(),
    responsibleUserId: form.responsibleUserId.trim(),
    validFrom: form.validFrom.trim(),
    validTo: form.validTo.trim(),
    status: form.status,
  };
}

function toApiPayload(kind: CenterKind, form: CenterFormState) {
  const common = {
    companyId: form.companyId,
    locationId: form.locationId,
    responsibleUserId: form.responsibleUserId,
    validFrom: form.validFrom,
    validTo: form.validTo,
    status: form.status,
  };
  return kind === "cost"
    ? {
        ...common,
        departmentId: form.departmentId,
        costCenterCode: form.centerCode,
        costCenterName: form.centerName,
        costCenterType: form.centerType,
      }
    : {
        ...common,
        profitCenterCode: form.centerCode,
        profitCenterName: form.centerName,
        businessSegment: form.businessSegment,
      };
}

function toFormState(center: CenterRecord): CenterFormState {
  return {
    companyId: center.companyId,
    locationId: center.locationId ?? "",
    departmentId: center.departmentId ?? "",
    centerCode: center.centerCode,
    centerName: center.centerName,
    centerType: center.centerType ?? "OTHER",
    businessSegment: center.businessSegment ?? "",
    responsibleUserId: center.responsibleUserId ?? "",
    validFrom: center.validFrom,
    validTo: center.validTo ?? "",
    status: center.status,
  };
}

function emptyFormState(companies: ControllingCompanyOption[]): CenterFormState {
  return {
    companyId: activeCompanies(companies)[0]?.id ?? "",
    locationId: "",
    departmentId: "",
    centerCode: "",
    centerName: "",
    centerType: "OTHER",
    businessSegment: "",
    responsibleUserId: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    status: "ACTIVE",
  };
}

function activeCompanies(companies: ControllingCompanyOption[]) {
  return companies.filter((company) => company.status === "ACTIVE");
}

function sortCenters(centers: CenterRecord[]) {
  return [...centers].sort((a, b) => a.centerCode.localeCompare(b.centerCode));
}

function extractFieldErrors(
  kind: CenterKind,
  envelope: ApiEnvelope<unknown>,
): CenterFieldErrors {
  const details = envelope.error?.details;
  if (!details || typeof details !== "object") return {};
  const record = details as { fieldErrors?: Record<string, unknown> };
  if (!record.fieldErrors || typeof record.fieldErrors !== "object") return {};

  const errors: CenterFieldErrors = {};
  for (const [key, value] of Object.entries(record.fieldErrors)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const message = value.find((item) => typeof item === "string");
    const formKey = toFormKey(kind, key);
    if (typeof message === "string" && formKey) errors[formKey] = message;
  }
  return errors;
}

function toFormKey(kind: CenterKind, key: string): keyof CenterFormState | null {
  if (key === "costCenterCode" || key === "profitCenterCode") return "centerCode";
  if (key === "costCenterName" || key === "profitCenterName") return "centerName";
  if (key === "costCenterType") return "centerType";
  if (key === "businessSegment") return "businessSegment";
  if (
    key === "companyId" ||
    key === "locationId" ||
    key === "responsibleUserId" ||
    key === "validFrom" ||
    key === "validTo" ||
    key === "status" ||
    (kind === "cost" && key === "departmentId")
  ) {
    return key as keyof CenterFormState;
  }
  return null;
}

function mapDomainError(
  kind: CenterKind,
  envelope: ApiEnvelope<unknown>,
  errors: CenterFieldErrors,
) {
  const code = envelope.error?.code;
  if (code === `${kind === "cost" ? "COST" : "PROFIT"}_CENTER_CODE_EXISTS`) {
    errors.centerCode = envelope.error?.message;
  }
  if (code?.endsWith("_COMPANY_NOT_FOUND")) errors.companyId = envelope.error?.message;
  if (code?.endsWith("_LOCATION_NOT_FOUND")) errors.locationId = envelope.error?.message;
  if (code?.endsWith("_DEPARTMENT_NOT_FOUND")) errors.departmentId = envelope.error?.message;
  if (code?.endsWith("_RESPONSIBLE_USER_NOT_FOUND")) errors.responsibleUserId = envelope.error?.message;
}

function typeLabel(type: CostCenterTypeValue) {
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function StatusBadge({ status }: { status: ControllingCenterStatusValue }) {
  return status === "ACTIVE" ? <Badge variant="success">ACTIVE</Badge> : <Badge variant="warning">INACTIVE</Badge>;
}

function LoadingRows() {
  return <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>;
}

function FormField({
  label,
  value,
  onChange,
  error,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  type?: "text" | "date";
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring ${error ? "border-danger" : "border-border"}`} />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring ${error ? "border-danger" : "border-border"}`}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function FilterSelect({ value, options, onChange }: { value: string; options: Array<{ label: string; value: string }>; onChange: (value: string) => void }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
}
