"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
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
import {
  type DepartmentCompanyOption,
  type DepartmentHeadUserOption,
  type DepartmentLocationOption,
  type DepartmentParentOption,
  type DepartmentRecord,
  type DepartmentStatusValue,
  type DepartmentTypeValue,
} from "@/lib/foundation/department";

type FormMode = "view" | "edit" | "create";

type DepartmentFormState = {
  companyId: string;
  locationId: string;
  departmentCode: string;
  departmentName: string;
  departmentType: DepartmentTypeValue;
  parentDepartmentId: string;
  departmentHeadUserId: string;
  costCenterCode: string;
  status: DepartmentStatusValue;
};

type DepartmentFieldErrors = Partial<
  Record<keyof DepartmentFormState, string>
>;

type DepartmentOptions = {
  companies: DepartmentCompanyOption[];
  locations: DepartmentLocationOption[];
  parents: DepartmentParentOption[];
  users: DepartmentHeadUserOption[];
};

const DEPARTMENT_TYPES: DepartmentTypeValue[] = [
  "FINANCE",
  "PURCHASE",
  "SALES",
  "STORES",
  "PRODUCTION",
  "QUALITY",
  "HR",
  "ADMIN",
  "IT",
  "MANAGEMENT",
  "OTHER",
];
const DEPARTMENT_STATUSES: DepartmentStatusValue[] = ["ACTIVE", "INACTIVE"];

export function DepartmentSetupDashboard({
  initialDepartments,
  initialCompanies,
  initialLocations,
  initialParents,
  initialUsers,
  canManage,
  organizationName,
}: {
  initialDepartments: DepartmentRecord[];
  initialCompanies: DepartmentCompanyOption[];
  initialLocations: DepartmentLocationOption[];
  initialParents: DepartmentParentOption[];
  initialUsers: DepartmentHeadUserOption[];
  canManage: boolean;
  organizationName: string;
}) {
  const firstDepartment = initialDepartments[0] ?? null;
  const [departments, setDepartments] = useState(
    sortDepartments(initialDepartments),
  );
  const [options, setOptions] = useState<DepartmentOptions>({
    companies: initialCompanies,
    locations: initialLocations,
    parents: initialParents,
    users: initialUsers,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | DepartmentTypeValue>(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | DepartmentStatusValue
  >("ALL");
  const [mode, setMode] = useState<FormMode>(
    firstDepartment
      ? "view"
      : canManage && activeCompanies(initialCompanies).length > 0
        ? "create"
        : "view",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    firstDepartment?.id ?? null,
  );
  const [form, setForm] = useState<DepartmentFormState>(
    firstDepartment
      ? toFormState(firstDepartment)
      : emptyFormState(initialCompanies),
  );
  const [fieldErrors, setFieldErrors] = useState<DepartmentFieldErrors>({});
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { showToast } = useToast();

  const selectedDepartment = useMemo(
    () => departments.find((department) => department.id === selectedId) ?? null,
    [departments, selectedId],
  );

  const filteredDepartments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return departments.filter((department) => {
      if (companyFilter !== "ALL" && department.companyId !== companyFilter) {
        return false;
      }
      if (
        typeFilter !== "ALL" &&
        department.departmentType !== typeFilter
      ) {
        return false;
      }
      if (statusFilter !== "ALL" && department.status !== statusFilter) {
        return false;
      }
      if (!query) return true;

      return [
        department.departmentCode,
        department.departmentName,
        department.departmentType,
        department.companyCode,
        department.companyName,
        department.locationCode ?? "",
        department.locationName ?? "",
        department.parentDepartmentCode ?? "",
        department.parentDepartmentName ?? "",
        department.departmentHeadName ?? "",
        department.costCenterCode ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [companyFilter, departments, searchQuery, statusFilter, typeFilter]);

  const companyLocations = useMemo(
    () =>
      options.locations.filter(
        (location) => location.companyId === form.companyId,
      ),
    [form.companyId, options.locations],
  );
  const companyParents = useMemo(
    () =>
      options.parents.filter(
        (parent) =>
          parent.companyId === form.companyId && parent.id !== selectedId,
      ),
    [form.companyId, options.parents, selectedId],
  );

  async function refreshList() {
    setLoadingList(true);
    const result = await apiFetch<
      { items: DepartmentRecord[] } & DepartmentOptions
    >("/api/foundation/departments");
    setLoadingList(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to refresh departments."),
      });
      return;
    }

    const nextDepartments = sortDepartments(result.data.items);
    setDepartments(nextDepartments);
    setOptions({
      companies: result.data.companies,
      locations: result.data.locations,
      parents: result.data.parents,
      users: result.data.users,
    });

    if (!selectedId && nextDepartments.length > 0) {
      setSelectedId(nextDepartments[0].id);
      if (mode !== "create") {
        setMode("view");
        setForm(toFormState(nextDepartments[0]));
      }
      return;
    }

    if (selectedId) {
      const current = nextDepartments.find(
        (department) => department.id === selectedId,
      );
      if (current && mode !== "create") setForm(toFormState(current));
    }
  }

  async function loadDepartmentDetail(id: string, nextMode: FormMode) {
    setLoadingDetail(true);
    const result = await apiFetch<DepartmentRecord>(
      `/api/foundation/departments/${id}`,
    );
    setLoadingDetail(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to load department details."),
      });
      return;
    }

    const nextRecord = result.data;
    setDepartments((current) =>
      sortDepartments([
        nextRecord,
        ...current.filter((department) => department.id !== nextRecord.id),
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
        message: "Create or activate a company before adding a department.",
      });
      return;
    }
    setMode("create");
    setSelectedId(null);
    setForm(emptyFormState(options.companies));
    setFieldErrors({});
  }

  function cancelEdit() {
    if (selectedDepartment) {
      setMode("view");
      setForm(toFormState(selectedDepartment));
    } else if (canManage && activeCompanies(options.companies).length > 0) {
      beginCreate();
    }
    setFieldErrors({});
  }

  function updateField<K extends keyof DepartmentFormState>(
    field: K,
    value: DepartmentFormState[K],
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
      parentDepartmentId: options.parents.some(
        (parent) =>
          parent.id === current.parentDepartmentId &&
          parent.companyId === companyId,
      )
        ? current.parentDepartmentId
        : "",
    }));
    setFieldErrors((current) => ({
      ...current,
      companyId: undefined,
      locationId: undefined,
      parentDepartmentId: undefined,
    }));
  }

  function validateForm(): DepartmentFieldErrors {
    const errors: DepartmentFieldErrors = {};
    const payload = normalizeForm(form);

    if (!payload.companyId) errors.companyId = "Company is required";
    if (!payload.departmentCode) {
      errors.departmentCode = "Department code is required";
    } else if (!/^[A-Z0-9_-]+$/.test(payload.departmentCode)) {
      errors.departmentCode =
        "Use only letters, numbers, hyphen, and underscore";
    }
    if (!payload.departmentName) {
      errors.departmentName = "Department name is required";
    }
    if (!payload.departmentType) {
      errors.departmentType = "Department type is required";
    }
    if (!payload.status) errors.status = "Status is required";

    const company = options.companies.find(
      (item) => item.id === payload.companyId,
    );
    if (!company) {
      errors.companyId = "Select a valid company";
    } else if (
      company.status !== "ACTIVE" &&
      payload.companyId !== selectedDepartment?.companyId
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
        payload.locationId !== selectedDepartment?.locationId
      ) {
        errors.locationId = "Select an active location";
      }
    }

    if (payload.parentDepartmentId) {
      const parent = options.parents.find(
        (item) => item.id === payload.parentDepartmentId,
      );
      if (payload.parentDepartmentId === selectedId) {
        errors.parentDepartmentId = "A department cannot be its own parent";
      } else if (!parent || parent.companyId !== payload.companyId) {
        errors.parentDepartmentId =
          "Select a parent department under the chosen company";
      } else if (
        parent.status !== "ACTIVE" &&
        payload.parentDepartmentId !== selectedDepartment?.parentDepartmentId
      ) {
        errors.parentDepartmentId = "Select an active parent department";
      }
    }

    if (
      payload.departmentHeadUserId &&
      !options.users.some((user) => user.id === payload.departmentHeadUserId)
    ) {
      errors.departmentHeadUserId =
        "Select a department head from this organization";
    }

    const duplicate = departments.find(
      (department) =>
        department.departmentCode.toUpperCase() === payload.departmentCode &&
        department.id !== selectedId,
    );
    if (duplicate) {
      errors.departmentCode =
        "This department code already exists in your organization";
    }

    return errors;
  }

  async function saveDepartment() {
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
    const payload = normalizeForm(form);
    const endpoint =
      mode === "edit" && selectedId
        ? `/api/foundation/departments/${selectedId}`
        : "/api/foundation/departments";
    const method = mode === "edit" && selectedId ? "PATCH" : "POST";
    const result = await apiFetch<DepartmentRecord>(endpoint, {
      method,
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!result.success || !result.data) {
      const serverErrors = extractFieldErrors(result);
      if (result.error?.code === "DEPARTMENT_CODE_EXISTS") {
        serverErrors.departmentCode = result.error.message;
      }
      if (result.error?.code === "DEPARTMENT_COMPANY_NOT_FOUND") {
        serverErrors.companyId = result.error.message;
      }
      if (result.error?.code === "DEPARTMENT_LOCATION_NOT_FOUND") {
        serverErrors.locationId = result.error.message;
      }
      if (
        result.error?.code === "DEPARTMENT_PARENT_NOT_FOUND" ||
        result.error?.code === "DEPARTMENT_PARENT_CYCLE"
      ) {
        serverErrors.parentDepartmentId = result.error.message;
      }
      if (result.error?.code === "DEPARTMENT_HEAD_NOT_FOUND") {
        serverErrors.departmentHeadUserId = result.error.message;
      }
      if (Object.keys(serverErrors).length > 0) setFieldErrors(serverErrors);
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to save department."),
      });
      return;
    }

    const saved = result.data;
    setDepartments((current) =>
      sortDepartments([
        saved,
        ...current.filter((department) => department.id !== saved.id),
      ]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    setFieldErrors({});
    await refreshList();
    showToast({
      variant: "success",
      message: mode === "edit" ? "Department updated." : "Department created.",
    });
  }

  async function deactivateDepartmentRecord(targetId?: string) {
    const id = targetId ?? selectedId;
    if (!id) return;

    setDeactivating(true);
    const result = await apiFetch<DepartmentRecord>(
      `/api/foundation/departments/${id}`,
      { method: "DELETE" },
    );
    setDeactivating(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to deactivate department."),
      });
      return;
    }

    const saved = result.data;
    setDepartments((current) =>
      sortDepartments([
        saved,
        ...current.filter((department) => department.id !== saved.id),
      ]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    showToast({ variant: "success", message: "Department deactivated." });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Foundation</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Departments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintain department ownership, reporting structure, and cost-center
            alignment for {organizationName}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!canManage ? <Badge variant="info">View only</Badge> : null}
          <Button
            type="button"
            variant="outline"
            onClick={refreshList}
            disabled={loadingList}
          >
            {loadingList ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          {canManage ? (
            <Button type="button" onClick={beginCreate}>
              <Plus className="h-4 w-4" />
              Create Department
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Department Register</CardTitle>
                <CardDescription>
                  Search, filter, and maintain departments under each legal entity.
                </CardDescription>
              </div>
              <Badge variant="default">{departments.length} total</Badge>
            </div>
            <div className="grid gap-2 pt-3 lg:grid-cols-2 xl:grid-cols-3">
              <label className="relative xl:col-span-3">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search code, name, company, location, parent, head, or cost center"
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
              <FilterSelect
                value={typeFilter}
                onChange={(value) =>
                  setTypeFilter(value as "ALL" | DepartmentTypeValue)
                }
                options={[
                  { label: "All types", value: "ALL" },
                  ...DEPARTMENT_TYPES.map((type) => ({
                    label: typeLabel(type),
                    value: type,
                  })),
                ]}
              />
              <FilterSelect
                value={statusFilter}
                onChange={(value) =>
                  setStatusFilter(value as "ALL" | DepartmentStatusValue)
                }
                options={[
                  { label: "All statuses", value: "ALL" },
                  ...DEPARTMENT_STATUSES.map((status) => ({
                    label: status,
                    value: status,
                  })),
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loadingList && departments.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredDepartments.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No department records found"
                description={
                  searchQuery ||
                  companyFilter !== "ALL" ||
                  typeFilter !== "ALL" ||
                  statusFilter !== "ALL"
                    ? "Try a different search or filter."
                    : canManage
                      ? "Create your first department for an active company."
                      : "No department records are available yet."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Department</th>
                      <th className="px-2 py-2">Company / Location</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartments.map((department) => (
                      <tr
                        key={department.id}
                        className={`border-b border-border/60 ${
                          selectedId === department.id ? "bg-muted/40" : ""
                        }`}
                      >
                        <td className="px-2 py-3 font-semibold">
                          {department.departmentCode}
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-medium">
                            {department.departmentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {department.costCenterCode
                              ? `Cost center: ${department.costCenterCode}`
                              : "No cost center assigned"}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <p className="text-xs font-medium">
                            {department.companyCode}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {department.locationCode ?? "Company-wide"}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <Badge variant="info">
                            {typeLabel(department.departmentType)}
                          </Badge>
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge status={department.status} />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                loadDepartmentDetail(department.id, "view")
                              }
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {canManage ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  loadDepartmentDetail(department.id, "edit")
                                }
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                            ) : null}
                            {canManage && department.status === "ACTIVE" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(department.id);
                                  setForm(toFormState(department));
                                  setMode("view");
                                  void deactivateDepartmentRecord(department.id);
                                }}
                                disabled={deactivating}
                              >
                                <Power className="h-4 w-4" />
                                Deactivate
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
              {mode === "create"
                ? "Create Department"
                : mode === "edit"
                  ? "Edit Department"
                  : "View Department"}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Enter legal-entity scope, hierarchy, and cost-center details."
                : selectedDepartment
                  ? `${selectedDepartment.departmentCode} - ${selectedDepartment.departmentName}`
                  : "Select a department from the table to view details."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingDetail ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : mode !== "create" && !selectedDepartment ? (
              <EmptyState
                icon={Building2}
                title="No department selected"
                description="Pick a row from the register to inspect its details."
              />
            ) : (
              <>
                <SelectField
                  label="Company / Legal Entity"
                  value={form.companyId}
                  options={options.companies.map((company) => ({
                    label: `${company.companyCode} - ${company.companyName}${
                      company.status === "INACTIVE" ? " (Inactive)" : ""
                    }`,
                    value: company.id,
                    disabled:
                      company.status === "INACTIVE" &&
                      company.id !== selectedDepartment?.companyId,
                  }))}
                  onChange={updateCompany}
                  error={fieldErrors.companyId}
                  disabled={!canManage || mode === "view"}
                />
                <SelectField
                  label="Location / Plant (Optional)"
                  value={form.locationId}
                  placeholder="Company-wide department"
                  options={companyLocations.map((location) => ({
                    label: `${location.locationCode} - ${location.locationName}${
                      location.status === "INACTIVE" ? " (Inactive)" : ""
                    }`,
                    value: location.id,
                    disabled:
                      location.status === "INACTIVE" &&
                      location.id !== selectedDepartment?.locationId,
                  }))}
                  onChange={(value) => updateField("locationId", value)}
                  error={fieldErrors.locationId}
                  disabled={!canManage || mode === "view"}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Department Code"
                    value={form.departmentCode}
                    onChange={(value) =>
                      updateField("departmentCode", value.toUpperCase())
                    }
                    error={fieldErrors.departmentCode}
                    disabled={!canManage || mode === "view"}
                  />
                  <SelectField
                    label="Department Type"
                    value={form.departmentType}
                    options={DEPARTMENT_TYPES.map((type) => ({
                      label: typeLabel(type),
                      value: type,
                    }))}
                    onChange={(value) =>
                      updateField("departmentType", value as DepartmentTypeValue)
                    }
                    error={fieldErrors.departmentType}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Department Name"
                    value={form.departmentName}
                    onChange={(value) => updateField("departmentName", value)}
                    error={fieldErrors.departmentName}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Cost Center Code (Optional)"
                    value={form.costCenterCode}
                    onChange={(value) => updateField("costCenterCode", value)}
                    error={fieldErrors.costCenterCode}
                    disabled={!canManage || mode === "view"}
                  />
                </div>
                <SelectField
                  label="Parent Department (Optional)"
                  value={form.parentDepartmentId}
                  placeholder="No parent department"
                  options={companyParents.map((parent) => ({
                    label: `${parent.departmentCode} - ${parent.departmentName}${
                      parent.status === "INACTIVE" ? " (Inactive)" : ""
                    }`,
                    value: parent.id,
                    disabled:
                      parent.status === "INACTIVE" &&
                      parent.id !== selectedDepartment?.parentDepartmentId,
                  }))}
                  onChange={(value) =>
                    updateField("parentDepartmentId", value)
                  }
                  error={fieldErrors.parentDepartmentId}
                  disabled={!canManage || mode === "view"}
                />
                {options.users.length > 0 ? (
                  <SelectField
                    label="Department Head (Optional)"
                    value={form.departmentHeadUserId}
                    placeholder="No department head assigned"
                    options={options.users.map((user) => ({
                      label: `${user.name} - ${user.email}`,
                      value: user.id,
                    }))}
                    onChange={(value) =>
                      updateField("departmentHeadUserId", value)
                    }
                    error={fieldErrors.departmentHeadUserId}
                    disabled={!canManage || mode === "view"}
                  />
                ) : null}
                <SelectField
                  label="Status"
                  value={form.status}
                  options={DEPARTMENT_STATUSES.map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  onChange={(value) =>
                    updateField("status", value as DepartmentStatusValue)
                  }
                  error={fieldErrors.status}
                  disabled={!canManage || mode === "view"}
                />

                <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
                  {mode !== "view" ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  {canManage && mode === "view" && selectedDepartment ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMode("edit")}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : null}
                  {canManage && mode !== "view" ? (
                    <Button
                      type="button"
                      onClick={saveDepartment}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {mode === "edit" ? "Save Changes" : "Create Department"}
                    </Button>
                  ) : null}
                  {canManage &&
                  mode === "view" &&
                  selectedDepartment?.status === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => deactivateDepartmentRecord()}
                      disabled={deactivating}
                    >
                      {deactivating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4" />
                      )}
                      Deactivate
                    </Button>
                  ) : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function normalizeForm(form: DepartmentFormState): DepartmentFormState {
  return {
    companyId: form.companyId.trim(),
    locationId: form.locationId.trim(),
    departmentCode: form.departmentCode.trim().toUpperCase(),
    departmentName: form.departmentName.trim(),
    departmentType: form.departmentType,
    parentDepartmentId: form.parentDepartmentId.trim(),
    departmentHeadUserId: form.departmentHeadUserId.trim(),
    costCenterCode: form.costCenterCode.trim(),
    status: form.status,
  };
}

function toFormState(department: DepartmentRecord): DepartmentFormState {
  return {
    companyId: department.companyId,
    locationId: department.locationId ?? "",
    departmentCode: department.departmentCode,
    departmentName: department.departmentName,
    departmentType: department.departmentType,
    parentDepartmentId: department.parentDepartmentId ?? "",
    departmentHeadUserId: department.departmentHeadUserId ?? "",
    costCenterCode: department.costCenterCode ?? "",
    status: department.status,
  };
}

function emptyFormState(
  companies: DepartmentCompanyOption[],
): DepartmentFormState {
  return {
    companyId: activeCompanies(companies)[0]?.id ?? "",
    locationId: "",
    departmentCode: "",
    departmentName: "",
    departmentType: "OTHER",
    parentDepartmentId: "",
    departmentHeadUserId: "",
    costCenterCode: "",
    status: "ACTIVE",
  };
}

function activeCompanies(companies: DepartmentCompanyOption[]) {
  return companies.filter((company) => company.status === "ACTIVE");
}

function sortDepartments(departments: DepartmentRecord[]): DepartmentRecord[] {
  return [...departments].sort((a, b) => {
    const codeOrder = a.departmentCode.localeCompare(b.departmentCode);
    if (codeOrder !== 0) return codeOrder;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function extractFieldErrors(
  envelope: ApiEnvelope<unknown>,
): DepartmentFieldErrors {
  const details = envelope.error?.details;
  if (!details || typeof details !== "object") return {};

  const record = details as { fieldErrors?: Record<string, unknown> };
  if (!record.fieldErrors || typeof record.fieldErrors !== "object") return {};

  const fieldErrors: DepartmentFieldErrors = {};
  for (const [key, value] of Object.entries(record.fieldErrors)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const message = value.find((item) => typeof item === "string");
    if (typeof message === "string" && isDepartmentFieldKey(key)) {
      fieldErrors[key] = message;
    }
  }
  return fieldErrors;
}

function isDepartmentFieldKey(
  value: string,
): value is keyof DepartmentFormState {
  return (
    value === "companyId" ||
    value === "locationId" ||
    value === "departmentCode" ||
    value === "departmentName" ||
    value === "departmentType" ||
    value === "parentDepartmentId" ||
    value === "departmentHeadUserId" ||
    value === "costCenterCode" ||
    value === "status"
  );
}

function typeLabel(type: DepartmentTypeValue) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function StatusBadge({ status }: { status: DepartmentStatusValue }) {
  if (status === "ACTIVE") return <Badge variant="success">ACTIVE</Badge>;
  return <Badge variant="warning">INACTIVE</Badge>;
}

function FormField({
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring ${
          error ? "border-danger" : "border-border"
        }`}
      />
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
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={`h-9 rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring ${
          error ? "border-danger" : "border-border"
        }`}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
