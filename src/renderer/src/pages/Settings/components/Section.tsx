interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export function Section({ title, icon, children }: SectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        {icon}
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}
