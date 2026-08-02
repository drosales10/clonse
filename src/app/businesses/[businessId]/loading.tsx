import { ClientShell } from "@/components/client/ClientShell";
import { BusinessDetailSkeleton } from "@/app/components/businesses/business-ui";

export default function BusinessDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="businesses-module">
        <BusinessDetailSkeleton />
      </div>
    </ClientShell>
  );
}
