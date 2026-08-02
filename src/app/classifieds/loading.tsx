import { ClientShell } from "@/components/client/ClientShell";
import { ClassifiedCatalogSkeleton } from "@/app/components/classifieds/classified-ui";

export default function ClassifiedsLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="classifieds-module">
        <ClassifiedCatalogSkeleton />
      </div>
    </ClientShell>
  );
}
