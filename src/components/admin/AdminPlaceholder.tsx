export default function AdminPlaceholder({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="h4 fw-bold mb-3">{title}</h1>
      <div className="card">
        <div className="card-body text-muted small" style={{ lineHeight: 1.65 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
