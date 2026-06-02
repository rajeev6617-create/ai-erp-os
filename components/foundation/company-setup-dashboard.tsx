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
import { useToast } from "@/components/providers/toast-provider";
import { apiFetch, getApiErrorMessage, type ApiEnvelope } from "@/lib/api/client";
import {
  GSTIN_REGEX,
  PAN_REGEX,
  type CompanyRecord,
  type CompanyStatusValue,
} from "@/lib/foundation/company";

type FormMode = "view" | "edit" | "create";

type CompanyFormState = {
  companyCode: string;
  companyName: string;
  legalName: string;
  cin: string;
  gstin: string;
  pan: string;
  registeredAddress: string;
  country: string;
  state: string;
  city: string;
  currency: string;
  fiscalYearStart: string;
  fiscalYearEnd: string;
  status: CompanyStatusValue;
};

type CompanyFieldErrors = Partial<Record<keyof CompanyFormState, string>>;

const COMPANY_STATUSES: CompanyStatusValue[] = ["ACTIVE", "INACTIVE"];

export function CompanySetupDashboard({
  initialCompanies,
  canManage,
  organizationName,
}: {
  initialCompanies: CompanyRecord[];
  canManage: boolean;
  organizationName: string;
}) {
  const firstCompany = initialCompanies[0] ?? null;
  const [companies, setCompanies] = useState(sortCompanies(initialCompanies));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CompanyStatusValue>("ALL");
  const [mode, setMode] = useState<FormMode>(
    firstCompany ? "view" : canManage ? "create" : "view",
  );
  const [selectedId, setSelectedId] = useState<string | null>(firstCompany?.id ?? null);
  const [form, setForm] = useState<CompanyFormState>(
    firstCompany ? toFormState(firstCompany) : emptyFormState(),
  );
  const [fieldErrors, setFieldErrors] = useState<CompanyFieldErrors>({});
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { showToast } = useToast();

  const selectedCompany = useMemo(
    () => companies.find((company) => company.id === selectedId) ?? null,
    [companies, selectedId],
  );

  const filteredCompanies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return companies.filter((company) => {
      if (statusFilter !== "ALL" && company.status !== statusFilter) return false;
      if (!query) return true;

      return [
        company.companyCode,
        company.companyName,
        company.legalName,
        company.gstin ?? "",
        company.pan ?? "",
        company.city,
        company.state,
        company.country,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [companies, searchQuery, statusFilter]);

  async function refreshList() {
    setLoadingList(true);
    const result = await apiFetch<{ items: CompanyRecord[] }>("/api/foundation/company");
    setLoadingList(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to refresh company records."),
      });
      return;
    }

    const next = sortCompanies(result.data.items);
    setCompanies(next);

    if (!selectedId && next.length > 0) {
      setSelectedId(next[0].id);
      if (mode !== "create") {
        setMode("view");
        setForm(toFormState(next[0]));
      }
      return;
    }

    if (selectedId) {
      const current = next.find((company) => company.id === selectedId);
      if (current && mode !== "create") {
        setForm(toFormState(current));
      }
    }
  }

  async function loadCompanyDetail(id: string, nextMode: FormMode) {
    setLoadingDetail(true);
    const result = await apiFetch<CompanyRecord>(`/api/foundation/company/${id}`);
    setLoadingDetail(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to load company details."),
      });
      return;
    }

    const nextRecord = result.data;
    setCompanies((current) =>
      sortCompanies([
        nextRecord,
        ...current.filter((company) => company.id !== nextRecord.id),
      ]),
    );
    setSelectedId(nextRecord.id);
    setMode(nextMode);
    setForm(toFormState(nextRecord));
    setFieldErrors({});
  }

  function beginCreate() {
    setMode("create");
    setSelectedId(null);
    setForm(emptyFormState());
    setFieldErrors({});
  }

  function cancelEdit() {
    if (selectedCompany) {
      setMode("view");
      setForm(toFormState(selectedCompany));
    } else if (canManage) {
      beginCreate();
    }
    setFieldErrors({});
  }

  function updateField<K extends keyof CompanyFormState>(
    field: K,
    value: CompanyFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateForm(): CompanyFieldErrors {
    const errors: CompanyFieldErrors = {};
    const payload = normalizeForm(form);

    if (!payload.companyCode) errors.companyCode = "Company code is required";
    if (!payload.companyName) errors.companyName = "Company name is required";
    if (!payload.legalName) errors.legalName = "Legal name is required";
    if (!payload.registeredAddress) {
      errors.registeredAddress = "Registered address is required";
    }
    if (!payload.country) errors.country = "Country is required";
    if (!payload.state) errors.state = "State is required";
    if (!payload.city) errors.city = "City is required";
    if (!payload.currency) errors.currency = "Currency is required";
    if (!payload.fiscalYearStart) {
      errors.fiscalYearStart = "Fiscal year start is required";
    }
    if (!payload.fiscalYearEnd) {
      errors.fiscalYearEnd = "Fiscal year end is required";
    }
    if (payload.currency && !/^[A-Z]{3}$/.test(payload.currency)) {
      errors.currency = "Currency must be a 3-letter ISO code";
    }
    if (payload.gstin && !GSTIN_REGEX.test(payload.gstin)) {
      errors.gstin = "GSTIN format is invalid";
    }
    if (payload.pan && !PAN_REGEX.test(payload.pan)) {
      errors.pan = "PAN format is invalid";
    }
    if (payload.fiscalYearStart && payload.fiscalYearEnd) {
      const start = new Date(`${payload.fiscalYearStart}T00:00:00.000Z`);
      const end = new Date(`${payload.fiscalYearEnd}T00:00:00.000Z`);
      if (end < start) {
        errors.fiscalYearEnd =
          "Fiscal year end must be on or after fiscal year start";
      }
    }

    const duplicate = companies.find(
      (company) =>
        company.companyCode.toUpperCase() === payload.companyCode &&
        company.id !== selectedId,
    );
    if (duplicate) {
      errors.companyCode = "This company code already exists in your organization";
    }

    return errors;
  }

  async function saveCompany() {
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
        ? `/api/foundation/company/${selectedId}`
        : "/api/foundation/company";
    const method = mode === "edit" && selectedId ? "PATCH" : "POST";

    const result = await apiFetch<CompanyRecord>(endpoint, {
      method,
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!result.success || !result.data) {
      const serverErrors = extractFieldErrors(result);
      if (result.error?.code === "COMPANY_CODE_EXISTS") {
        serverErrors.companyCode = result.error.message;
      }
      if (Object.keys(serverErrors).length > 0) {
        setFieldErrors(serverErrors);
      }
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to save company."),
      });
      return;
    }

    const saved = result.data;
    setCompanies((current) =>
      sortCompanies([saved, ...current.filter((company) => company.id !== saved.id)]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    setFieldErrors({});
    showToast({
      variant: "success",
      message: mode === "edit" ? "Company updated." : "Company created.",
    });
  }

  async function deactivateCompanyRecord(targetId?: string) {
    const id = targetId ?? selectedId;
    if (!id) return;
    setDeactivating(true);
    const result = await apiFetch<CompanyRecord>(
      `/api/foundation/company/${id}`,
      { method: "DELETE" },
    );
    setDeactivating(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to deactivate company."),
      });
      return;
    }

    const saved = result.data;
    setCompanies((current) =>
      sortCompanies([saved, ...current.filter((company) => company.id !== saved.id)]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    showToast({ variant: "success", message: "Company deactivated." });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Foundation</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Company Setup
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintain legal entities and fiscal settings for {organizationName}.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
              Create Company
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Company / Legal Entities</CardTitle>
                <CardDescription>
                  Search, filter, view, and maintain company master records.
                </CardDescription>
              </div>
              <Badge variant="default">{companies.length} total</Badge>
            </div>
            <div className="grid gap-2 pt-3 sm:grid-cols-[1fr_180px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by code, name, GSTIN, PAN, or city"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "ALL" | CompanyStatusValue)
                }
                className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {loadingList && companies.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredCompanies.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="No company records found"
                description={
                  searchQuery || statusFilter !== "ALL"
                    ? "Try a different search or status filter."
                    : canManage
                      ? "Create your first company to initialize the foundation master data."
                      : "No company records are available yet."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Company</th>
                      <th className="px-2 py-2">Location</th>
                      <th className="px-2 py-2">Currency</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className={`border-b border-border/60 ${
                          selectedId === company.id ? "bg-muted/40" : ""
                        }`}
                      >
                        <td className="px-2 py-3 font-semibold">{company.companyCode}</td>
                        <td className="px-2 py-3">
                          <p className="font-medium">{company.companyName}</p>
                          <p className="text-xs text-muted-foreground">{company.legalName}</p>
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">
                          {company.city}, {company.state}, {company.country}
                        </td>
                        <td className="px-2 py-3">{company.currency}</td>
                        <td className="px-2 py-3">
                          <StatusBadge status={company.status} />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => loadCompanyDetail(company.id, "view")}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {canManage ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => loadCompanyDetail(company.id, "edit")}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                            ) : null}
                            {canManage && company.status === "ACTIVE" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(company.id);
                                  setForm(toFormState(company));
                                  setMode("view");
                                  void deactivateCompanyRecord(company.id);
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
                ? "Create Company"
                : mode === "edit"
                  ? "Edit Company"
                  : "View Company"}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Enter legal entity details and fiscal settings."
                : selectedCompany
                  ? `${selectedCompany.companyCode} · ${selectedCompany.companyName}`
                  : "Select a company from the table to view details."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingDetail ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : mode !== "create" && !selectedCompany ? (
              <EmptyState
                icon={Building2}
                title="No company selected"
                description="Pick a row from the list to inspect legal-entity details."
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Company Code"
                    value={form.companyCode}
                    onChange={(value) => updateField("companyCode", value)}
                    error={fieldErrors.companyCode}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Currency"
                    value={form.currency}
                    onChange={(value) => updateField("currency", value.toUpperCase())}
                    error={fieldErrors.currency}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Company Name"
                    value={form.companyName}
                    onChange={(value) => updateField("companyName", value)}
                    error={fieldErrors.companyName}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Legal Name"
                    value={form.legalName}
                    onChange={(value) => updateField("legalName", value)}
                    error={fieldErrors.legalName}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="CIN"
                    value={form.cin}
                    onChange={(value) => updateField("cin", value.toUpperCase())}
                    error={fieldErrors.cin}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="GSTIN"
                    value={form.gstin}
                    onChange={(value) => updateField("gstin", value.toUpperCase())}
                    error={fieldErrors.gstin}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="PAN"
                    value={form.pan}
                    onChange={(value) => updateField("pan", value.toUpperCase())}
                    error={fieldErrors.pan}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Country"
                    value={form.country}
                    onChange={(value) => updateField("country", value)}
                    error={fieldErrors.country}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="State"
                    value={form.state}
                    onChange={(value) => updateField("state", value)}
                    error={fieldErrors.state}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="City"
                    value={form.city}
                    onChange={(value) => updateField("city", value)}
                    error={fieldErrors.city}
                    disabled={!canManage || mode === "view"}
                  />
                  <DateField
                    label="Fiscal Year Start"
                    value={form.fiscalYearStart}
                    onChange={(value) => updateField("fiscalYearStart", value)}
                    error={fieldErrors.fiscalYearStart}
                    disabled={!canManage || mode === "view"}
                  />
                  <DateField
                    label="Fiscal Year End"
                    value={form.fiscalYearEnd}
                    onChange={(value) => updateField("fiscalYearEnd", value)}
                    error={fieldErrors.fiscalYearEnd}
                    disabled={!canManage || mode === "view"}
                  />
                </div>
                <TextAreaField
                  label="Registered Address"
                  value={form.registeredAddress}
                  onChange={(value) => updateField("registeredAddress", value)}
                  error={fieldErrors.registeredAddress}
                  disabled={!canManage || mode === "view"}
                />
                <SelectField
                  label="Status"
                  value={form.status}
                  options={COMPANY_STATUSES.map((status) => ({
                    label: status,
                    value: status,
                  }))}
                  onChange={(value) => updateField("status", value as CompanyStatusValue)}
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
                  {canManage && mode === "view" && selectedCompany ? (
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
                    <Button type="button" onClick={saveCompany} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {mode === "edit" ? "Save Changes" : "Create Company"}
                    </Button>
                  ) : null}
                  {canManage &&
                  mode === "view" &&
                  selectedCompany?.status === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => deactivateCompanyRecord()}
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

function normalizeForm(form: CompanyFormState): CompanyFormState {
  return {
    companyCode: form.companyCode.trim().toUpperCase(),
    companyName: form.companyName.trim(),
    legalName: form.legalName.trim(),
    cin: form.cin.trim().toUpperCase(),
    gstin: form.gstin.trim().toUpperCase(),
    pan: form.pan.trim().toUpperCase(),
    registeredAddress: form.registeredAddress.trim(),
    country: form.country.trim(),
    state: form.state.trim(),
    city: form.city.trim(),
    currency: form.currency.trim().toUpperCase(),
    fiscalYearStart: form.fiscalYearStart,
    fiscalYearEnd: form.fiscalYearEnd,
    status: form.status,
  };
}

function toFormState(company: CompanyRecord): CompanyFormState {
  return {
    companyCode: company.companyCode,
    companyName: company.companyName,
    legalName: company.legalName,
    cin: company.cin ?? "",
    gstin: company.gstin ?? "",
    pan: company.pan ?? "",
    registeredAddress: company.registeredAddress,
    country: company.country,
    state: company.state,
    city: company.city,
    currency: company.currency,
    fiscalYearStart: company.fiscalYearStart,
    fiscalYearEnd: company.fiscalYearEnd,
    status: company.status,
  };
}

function emptyFormState(): CompanyFormState {
  const now = new Date();
  const year = now.getUTCFullYear();
  return {
    companyCode: "",
    companyName: "",
    legalName: "",
    cin: "",
    gstin: "",
    pan: "",
    registeredAddress: "",
    country: "India",
    state: "",
    city: "",
    currency: "INR",
    fiscalYearStart: `${year}-04-01`,
    fiscalYearEnd: `${year + 1}-03-31`,
    status: "ACTIVE",
  };
}

function sortCompanies(companies: CompanyRecord[]): CompanyRecord[] {
  return [...companies].sort((a, b) => {
    const codeOrder = a.companyCode.localeCompare(b.companyCode);
    if (codeOrder !== 0) return codeOrder;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function extractFieldErrors(
  envelope: ApiEnvelope<unknown>,
): CompanyFieldErrors {
  const details = envelope.error?.details;
  if (!details || typeof details !== "object") return {};

  const record = details as { fieldErrors?: Record<string, unknown> };
  if (!record.fieldErrors || typeof record.fieldErrors !== "object") return {};

  const fieldErrors: CompanyFieldErrors = {};
  for (const [key, value] of Object.entries(record.fieldErrors)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const message = value.find((item) => typeof item === "string");
    if (typeof message !== "string") continue;
    if (isCompanyFieldKey(key)) {
      fieldErrors[key] = message;
    }
  }
  return fieldErrors;
}

function isCompanyFieldKey(value: string): value is keyof CompanyFormState {
  return (
    value === "companyCode" ||
    value === "companyName" ||
    value === "legalName" ||
    value === "cin" ||
    value === "gstin" ||
    value === "pan" ||
    value === "registeredAddress" ||
    value === "country" ||
    value === "state" ||
    value === "city" ||
    value === "currency" ||
    value === "fiscalYearStart" ||
    value === "fiscalYearEnd" ||
    value === "status"
  );
}

function StatusBadge({ status }: { status: CompanyStatusValue }) {
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

function DateField({
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
        type="date"
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

function TextAreaField({
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
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        disabled={disabled}
        className={`rounded-lg border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring ${
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
  disabled,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
