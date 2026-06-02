"use client";

import { useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Star,
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
import { GSTIN_REGEX } from "@/lib/foundation/company";
import {
  type LocationCompanyOption,
  type LocationRecord,
  type LocationStatusValue,
  type LocationTypeValue,
} from "@/lib/foundation/location";

type FormMode = "view" | "edit" | "create";

type LocationFormState = {
  companyId: string;
  locationCode: string;
  locationName: string;
  locationType: LocationTypeValue;
  gstRegistrationNumber: string;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  isPrimary: boolean;
  status: LocationStatusValue;
};

type LocationFieldErrors = Partial<Record<keyof LocationFormState, string>>;

const LOCATION_TYPES: LocationTypeValue[] = [
  "PLANT",
  "BRANCH",
  "OFFICE",
  "WAREHOUSE",
  "DEPOT",
];
const LOCATION_STATUSES: LocationStatusValue[] = ["ACTIVE", "INACTIVE"];

export function LocationSetupDashboard({
  initialLocations,
  initialCompanies,
  canManage,
  organizationName,
}: {
  initialLocations: LocationRecord[];
  initialCompanies: LocationCompanyOption[];
  canManage: boolean;
  organizationName: string;
}) {
  const firstLocation = initialLocations[0] ?? null;
  const [locations, setLocations] = useState(sortLocations(initialLocations));
  const [companies, setCompanies] = useState(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | LocationTypeValue>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LocationStatusValue>("ALL");
  const [mode, setMode] = useState<FormMode>(
    firstLocation ? "view" : canManage && activeCompanies(initialCompanies).length > 0 ? "create" : "view",
  );
  const [selectedId, setSelectedId] = useState<string | null>(firstLocation?.id ?? null);
  const [form, setForm] = useState<LocationFormState>(
    firstLocation ? toFormState(firstLocation) : emptyFormState(initialCompanies),
  );
  const [fieldErrors, setFieldErrors] = useState<LocationFieldErrors>({});
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const { showToast } = useToast();

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === selectedId) ?? null,
    [locations, selectedId],
  );

  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return locations.filter((location) => {
      if (companyFilter !== "ALL" && location.companyId !== companyFilter) return false;
      if (typeFilter !== "ALL" && location.locationType !== typeFilter) return false;
      if (statusFilter !== "ALL" && location.status !== statusFilter) return false;
      if (!query) return true;

      return [
        location.locationCode,
        location.locationName,
        location.companyCode,
        location.companyName,
        location.locationType,
        location.gstRegistrationNumber ?? "",
        location.city,
        location.state,
        location.country,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [companyFilter, locations, searchQuery, statusFilter, typeFilter]);

  async function refreshList() {
    setLoadingList(true);
    const result = await apiFetch<{
      items: LocationRecord[];
      companies: LocationCompanyOption[];
    }>("/api/foundation/locations");
    setLoadingList(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to refresh location records."),
      });
      return;
    }

    const nextLocations = sortLocations(result.data.items);
    setLocations(nextLocations);
    setCompanies(result.data.companies);

    if (!selectedId && nextLocations.length > 0) {
      setSelectedId(nextLocations[0].id);
      if (mode !== "create") {
        setMode("view");
        setForm(toFormState(nextLocations[0]));
      }
      return;
    }

    if (selectedId) {
      const current = nextLocations.find((location) => location.id === selectedId);
      if (current && mode !== "create") setForm(toFormState(current));
    }
  }

  async function loadLocationDetail(id: string, nextMode: FormMode) {
    setLoadingDetail(true);
    const result = await apiFetch<LocationRecord>(`/api/foundation/locations/${id}`);
    setLoadingDetail(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to load location details."),
      });
      return;
    }

    const nextRecord = result.data;
    setLocations((current) =>
      sortLocations([
        nextRecord,
        ...current.filter((location) => location.id !== nextRecord.id),
      ]),
    );
    setSelectedId(nextRecord.id);
    setMode(nextMode);
    setForm(toFormState(nextRecord));
    setFieldErrors({});
  }

  function beginCreate() {
    if (activeCompanies(companies).length === 0) {
      showToast({
        variant: "error",
        message: "Create or activate a company before adding a location.",
      });
      return;
    }
    setMode("create");
    setSelectedId(null);
    setForm(emptyFormState(companies));
    setFieldErrors({});
  }

  function cancelEdit() {
    if (selectedLocation) {
      setMode("view");
      setForm(toFormState(selectedLocation));
    } else if (canManage && activeCompanies(companies).length > 0) {
      beginCreate();
    }
    setFieldErrors({});
  }

  function updateField<K extends keyof LocationFormState>(
    field: K,
    value: LocationFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validateForm(): LocationFieldErrors {
    const errors: LocationFieldErrors = {};
    const payload = normalizeForm(form);

    if (!payload.companyId) errors.companyId = "Company is required";
    if (!payload.locationCode) errors.locationCode = "Location code is required";
    if (!payload.locationName) errors.locationName = "Location name is required";
    if (!payload.locationType) errors.locationType = "Location type is required";
    if (!payload.address) errors.address = "Address is required";
    if (!payload.country) errors.country = "Country is required";
    if (!payload.state) errors.state = "State is required";
    if (!payload.city) errors.city = "City is required";
    if (!payload.pincode) errors.pincode = "Pincode is required";

    if (
      payload.gstRegistrationNumber &&
      !GSTIN_REGEX.test(payload.gstRegistrationNumber)
    ) {
      errors.gstRegistrationNumber = "GST registration number format is invalid";
    }
    if (
      payload.contactEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.contactEmail)
    ) {
      errors.contactEmail = "Contact email format is invalid";
    }
    if (
      payload.country.toLowerCase() === "india" &&
      payload.pincode &&
      !/^[1-9]\d{5}$/.test(payload.pincode)
    ) {
      errors.pincode = "India pincode must be a valid 6-digit postal code";
    }
    if (payload.isPrimary && payload.status === "INACTIVE") {
      errors.isPrimary = "An inactive location cannot be primary";
    }

    const company = companies.find((item) => item.id === payload.companyId);
    if (!company) {
      errors.companyId = "Select a valid company";
    } else if (
      company.status !== "ACTIVE" &&
      payload.companyId !== selectedLocation?.companyId
    ) {
      errors.companyId = "Select an active company";
    }

    const duplicate = locations.find(
      (location) =>
        location.locationCode.toUpperCase() === payload.locationCode &&
        location.id !== selectedId,
    );
    if (duplicate) {
      errors.locationCode = "This location code already exists in your organization";
    }

    return errors;
  }

  async function saveLocation() {
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
        ? `/api/foundation/locations/${selectedId}`
        : "/api/foundation/locations";
    const method = mode === "edit" && selectedId ? "PATCH" : "POST";
    const result = await apiFetch<LocationRecord>(endpoint, {
      method,
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!result.success || !result.data) {
      const serverErrors = extractFieldErrors(result);
      if (result.error?.code === "LOCATION_CODE_EXISTS") {
        serverErrors.locationCode = result.error.message;
      }
      if (result.error?.code === "LOCATION_COMPANY_NOT_FOUND") {
        serverErrors.companyId = result.error.message;
      }
      if (Object.keys(serverErrors).length > 0) setFieldErrors(serverErrors);
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to save location."),
      });
      return;
    }

    const saved = result.data;
    setLocations((current) =>
      sortLocations([saved, ...current.filter((location) => location.id !== saved.id)]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    setFieldErrors({});
    await refreshList();
    showToast({
      variant: "success",
      message: mode === "edit" ? "Location updated." : "Location created.",
    });
  }

  async function deactivateLocationRecord(targetId?: string) {
    const id = targetId ?? selectedId;
    if (!id) return;

    setDeactivating(true);
    const result = await apiFetch<LocationRecord>(
      `/api/foundation/locations/${id}`,
      { method: "DELETE" },
    );
    setDeactivating(false);

    if (!result.success || !result.data) {
      showToast({
        variant: "error",
        message: getApiErrorMessage(result, "Unable to deactivate location."),
      });
      return;
    }

    const saved = result.data;
    setLocations((current) =>
      sortLocations([saved, ...current.filter((location) => location.id !== saved.id)]),
    );
    setSelectedId(saved.id);
    setMode("view");
    setForm(toFormState(saved));
    showToast({ variant: "success", message: "Location deactivated." });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Foundation</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Locations / Plants
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Maintain plants, branches, offices, warehouses, and depots for {organizationName}.
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
              Create Location
            </Button>
          ) : null}
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card className="xl:col-span-7">
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Plant / Branch / Location Register</CardTitle>
                <CardDescription>
                  Search, filter, and maintain operating locations under each legal entity.
                </CardDescription>
              </div>
              <Badge variant="default">{locations.length} total</Badge>
            </div>
            <div className="grid gap-2 pt-3 lg:grid-cols-2 xl:grid-cols-4">
              <label className="relative xl:col-span-4">
                <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search code, name, company, GSTIN, city, or state"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
                />
              </label>
              <FilterSelect
                value={companyFilter}
                onChange={setCompanyFilter}
                options={[
                  { label: "All companies", value: "ALL" },
                  ...companies.map((company) => ({
                    label: `${company.companyCode} - ${company.companyName}`,
                    value: company.id,
                  })),
                ]}
              />
              <FilterSelect
                value={typeFilter}
                onChange={(value) => setTypeFilter(value as "ALL" | LocationTypeValue)}
                options={[
                  { label: "All types", value: "ALL" },
                  ...LOCATION_TYPES.map((type) => ({ label: type, value: type })),
                ]}
              />
              <FilterSelect
                value={statusFilter}
                onChange={(value) => setStatusFilter(value as "ALL" | LocationStatusValue)}
                options={[
                  { label: "All statuses", value: "ALL" },
                  ...LOCATION_STATUSES.map((status) => ({ label: status, value: status })),
                ]}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loadingList && locations.length === 0 ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredLocations.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="No location records found"
                description={
                  searchQuery ||
                  companyFilter !== "ALL" ||
                  typeFilter !== "ALL" ||
                  statusFilter !== "ALL"
                    ? "Try a different search or filter."
                    : canManage
                      ? "Create your first operating location for an active company."
                      : "No location records are available yet."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-2">Code</th>
                      <th className="px-2 py-2">Location</th>
                      <th className="px-2 py-2">Company</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map((location) => (
                      <tr
                        key={location.id}
                        className={`border-b border-border/60 ${
                          selectedId === location.id ? "bg-muted/40" : ""
                        }`}
                      >
                        <td className="px-2 py-3 font-semibold">{location.locationCode}</td>
                        <td className="px-2 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-medium">{location.locationName}</p>
                            {location.isPrimary ? <PrimaryBadge /> : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {location.city}, {location.state}
                          </p>
                        </td>
                        <td className="px-2 py-3">
                          <p className="text-xs font-medium">{location.companyCode}</p>
                          <p className="text-xs text-muted-foreground">{location.companyName}</p>
                        </td>
                        <td className="px-2 py-3">
                          <Badge variant="info">{location.locationType}</Badge>
                        </td>
                        <td className="px-2 py-3">
                          <StatusBadge status={location.status} />
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => loadLocationDetail(location.id, "view")}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {canManage ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => loadLocationDetail(location.id, "edit")}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </Button>
                            ) : null}
                            {canManage && location.status === "ACTIVE" ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedId(location.id);
                                  setForm(toFormState(location));
                                  setMode("view");
                                  void deactivateLocationRecord(location.id);
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
                ? "Create Location"
                : mode === "edit"
                  ? "Edit Location"
                  : "View Location"}
            </CardTitle>
            <CardDescription>
              {mode === "create"
                ? "Enter operating-location and statutory details."
                : selectedLocation
                  ? `${selectedLocation.locationCode} - ${selectedLocation.locationName}`
                  : "Select a location from the table to view details."}
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
            ) : mode !== "create" && !selectedLocation ? (
              <EmptyState
                icon={MapPin}
                title="No location selected"
                description="Pick a row from the register to inspect its details."
              />
            ) : (
              <>
                <SelectField
                  label="Company / Legal Entity"
                  value={form.companyId}
                  options={companies.map((company) => ({
                    label: `${company.companyCode} - ${company.companyName}${
                      company.status === "INACTIVE" ? " (Inactive)" : ""
                    }`,
                    value: company.id,
                    disabled:
                      company.status === "INACTIVE" &&
                      company.id !== selectedLocation?.companyId,
                  }))}
                  onChange={(value) => updateField("companyId", value)}
                  error={fieldErrors.companyId}
                  disabled={!canManage || mode === "view"}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Location Code"
                    value={form.locationCode}
                    onChange={(value) => updateField("locationCode", value.toUpperCase())}
                    error={fieldErrors.locationCode}
                    disabled={!canManage || mode === "view"}
                  />
                  <SelectField
                    label="Location Type"
                    value={form.locationType}
                    options={LOCATION_TYPES.map((type) => ({ label: type, value: type }))}
                    onChange={(value) =>
                      updateField("locationType", value as LocationTypeValue)
                    }
                    error={fieldErrors.locationType}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Location Name"
                    value={form.locationName}
                    onChange={(value) => updateField("locationName", value)}
                    error={fieldErrors.locationName}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="GST Registration Number"
                    value={form.gstRegistrationNumber}
                    onChange={(value) =>
                      updateField("gstRegistrationNumber", value.toUpperCase())
                    }
                    error={fieldErrors.gstRegistrationNumber}
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
                  <FormField
                    label="Pincode"
                    value={form.pincode}
                    onChange={(value) => updateField("pincode", value)}
                    error={fieldErrors.pincode}
                    disabled={!canManage || mode === "view"}
                  />
                </div>
                <TextAreaField
                  label="Address"
                  value={form.address}
                  onChange={(value) => updateField("address", value)}
                  error={fieldErrors.address}
                  disabled={!canManage || mode === "view"}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField
                    label="Contact Person"
                    value={form.contactPerson}
                    onChange={(value) => updateField("contactPerson", value)}
                    error={fieldErrors.contactPerson}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Contact Email"
                    type="email"
                    value={form.contactEmail}
                    onChange={(value) => updateField("contactEmail", value)}
                    error={fieldErrors.contactEmail}
                    disabled={!canManage || mode === "view"}
                  />
                  <FormField
                    label="Contact Phone"
                    type="tel"
                    value={form.contactPhone}
                    onChange={(value) => updateField("contactPhone", value)}
                    error={fieldErrors.contactPhone}
                    disabled={!canManage || mode === "view"}
                  />
                  <SelectField
                    label="Status"
                    value={form.status}
                    options={LOCATION_STATUSES.map((status) => ({
                      label: status,
                      value: status,
                    }))}
                    onChange={(value) =>
                      updateField("status", value as LocationStatusValue)
                    }
                    disabled={!canManage || mode === "view"}
                  />
                </div>
                <CheckboxField
                  label="Primary location for this company"
                  checked={form.isPrimary}
                  onChange={(checked) => updateField("isPrimary", checked)}
                  error={fieldErrors.isPrimary}
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
                  {canManage && mode === "view" && selectedLocation ? (
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
                    <Button type="button" onClick={saveLocation} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      {mode === "edit" ? "Save Changes" : "Create Location"}
                    </Button>
                  ) : null}
                  {canManage &&
                  mode === "view" &&
                  selectedLocation?.status === "ACTIVE" ? (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => deactivateLocationRecord()}
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

function normalizeForm(form: LocationFormState): LocationFormState {
  return {
    companyId: form.companyId.trim(),
    locationCode: form.locationCode.trim().toUpperCase(),
    locationName: form.locationName.trim(),
    locationType: form.locationType,
    gstRegistrationNumber: form.gstRegistrationNumber.trim().toUpperCase(),
    address: form.address.trim(),
    country: form.country.trim(),
    state: form.state.trim(),
    city: form.city.trim(),
    pincode: form.pincode.trim(),
    contactPerson: form.contactPerson.trim(),
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim(),
    isPrimary: form.isPrimary,
    status: form.status,
  };
}

function toFormState(location: LocationRecord): LocationFormState {
  return {
    companyId: location.companyId,
    locationCode: location.locationCode,
    locationName: location.locationName,
    locationType: location.locationType,
    gstRegistrationNumber: location.gstRegistrationNumber ?? "",
    address: location.address,
    country: location.country,
    state: location.state,
    city: location.city,
    pincode: location.pincode,
    contactPerson: location.contactPerson ?? "",
    contactEmail: location.contactEmail ?? "",
    contactPhone: location.contactPhone ?? "",
    isPrimary: location.isPrimary,
    status: location.status,
  };
}

function emptyFormState(companies: LocationCompanyOption[]): LocationFormState {
  return {
    companyId: activeCompanies(companies)[0]?.id ?? "",
    locationCode: "",
    locationName: "",
    locationType: "PLANT",
    gstRegistrationNumber: "",
    address: "",
    country: "India",
    state: "",
    city: "",
    pincode: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    isPrimary: false,
    status: "ACTIVE",
  };
}

function activeCompanies(companies: LocationCompanyOption[]) {
  return companies.filter((company) => company.status === "ACTIVE");
}

function sortLocations(locations: LocationRecord[]): LocationRecord[] {
  return [...locations].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    const codeOrder = a.locationCode.localeCompare(b.locationCode);
    if (codeOrder !== 0) return codeOrder;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function extractFieldErrors(envelope: ApiEnvelope<unknown>): LocationFieldErrors {
  const details = envelope.error?.details;
  if (!details || typeof details !== "object") return {};

  const record = details as { fieldErrors?: Record<string, unknown> };
  if (!record.fieldErrors || typeof record.fieldErrors !== "object") return {};

  const fieldErrors: LocationFieldErrors = {};
  for (const [key, value] of Object.entries(record.fieldErrors)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const message = value.find((item) => typeof item === "string");
    if (typeof message === "string" && isLocationFieldKey(key)) {
      fieldErrors[key] = message;
    }
  }
  return fieldErrors;
}

function isLocationFieldKey(value: string): value is keyof LocationFormState {
  return (
    value === "companyId" ||
    value === "locationCode" ||
    value === "locationName" ||
    value === "locationType" ||
    value === "gstRegistrationNumber" ||
    value === "address" ||
    value === "country" ||
    value === "state" ||
    value === "city" ||
    value === "pincode" ||
    value === "contactPerson" ||
    value === "contactEmail" ||
    value === "contactPhone" ||
    value === "isPrimary" ||
    value === "status"
  );
}

function StatusBadge({ status }: { status: LocationStatusValue }) {
  if (status === "ACTIVE") return <Badge variant="success">ACTIVE</Badge>;
  return <Badge variant="warning">INACTIVE</Badge>;
}

function PrimaryBadge() {
  return (
    <Badge variant="success" className="gap-1">
      <Star className="h-3 w-3" />
      Primary
    </Badge>
  );
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
  type?: "text" | "email" | "tel";
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <input
        type={type}
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
  error,
  disabled,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
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
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
  error,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
          className="h-4 w-4 accent-primary"
        />
        {label}
      </span>
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
      className="h-9 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
