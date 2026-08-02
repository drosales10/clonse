export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-surface" data-surface="admin">{children}</div>;
}
