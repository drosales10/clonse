import { ClientShell } from "@/components/client/ClientShell";
import { ClassifiedDetailSkeleton } from "@/app/components/classifieds/classified-ui";

export default function ClassifiedDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="classifieds-module">
        <ClassifiedDetailSkeleton />
      </div>
    </ClientShell>
  );
}
