import { ClientShell } from "@/components/client/ClientShell";
import { BlogCatalogSkeleton } from "@/app/components/blogs/blog-ui";

export default function BlogsLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="blogs-module">
        <BlogCatalogSkeleton />
      </div>
    </ClientShell>
  );
}
