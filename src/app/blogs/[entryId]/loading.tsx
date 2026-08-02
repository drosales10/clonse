import { ClientShell } from "@/components/client/ClientShell";
import { BlogDetailSkeleton } from "@/app/components/blogs/blog-ui";

export default function BlogDetailLoadingPage() {
  return (
    <ClientShell current="explore">
      <div className="blogs-module">
        <BlogDetailSkeleton />
      </div>
    </ClientShell>
  );
}
