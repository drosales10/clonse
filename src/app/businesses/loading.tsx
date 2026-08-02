import { ClientShell } from "@/components/client/ClientShell";
import { BusinessCatalogSkeleton } from "@/app/components/businesses/business-ui";

export default function BusinessesLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="businesses-module">
        <BusinessCatalogSkeleton />
      </div>
    </ClientShell>
  );
}
