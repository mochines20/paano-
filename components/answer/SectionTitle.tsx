export function SectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h4
      className={`mb-2 mt-3 text-[11px] font-bold uppercase tracking-wide text-muted ${className}`}
    >
      {children}
    </h4>
  );
}
