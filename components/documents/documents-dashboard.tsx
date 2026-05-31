import { FileText, FolderOpen, HardDrive, Tags } from "lucide-react";
import { StatusBadge, ModuleDashboardShell } from "@/components/platform/module-dashboard";
import type { DocumentsDashboardData } from "@/lib/documents/types";

export function DocumentsDashboard({ data }: { data: DocumentsDashboardData }) {
  return (
    <ModuleDashboardShell
      eyebrow="Evidence library"
      title="Documents"
      description="Policies, compliance evidence, board packs, and workflow attachments with tenant-scoped retention."
      stats={data.stats}
      statIcons={[FileText, HardDrive, Tags, FolderOpen]}
      listTitle="Document library"
      listDescription="Recently updated files across folders"
      emptyIcon={FileText}
      emptyTitle="No documents"
      emptyDescription="Seed the database or upload files to populate the library."
    >
      {data.documents.length > 0 &&
        data.documents.map((doc) => (
          <div
            key={doc.id}
            className="grid gap-2 rounded-lg border border-border p-3 md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="text-sm font-semibold">{doc.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {doc.fileName} · {doc.folderPath} · {doc.sizeLabel}
              </p>
              {doc.tags.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Tags: {doc.tags.join(", ")}</p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <StatusBadge status={doc.status} />
              <span className="text-xs text-muted-foreground">{doc.visibility}</span>
            </div>
          </div>
        ))}
    </ModuleDashboardShell>
  );
}
