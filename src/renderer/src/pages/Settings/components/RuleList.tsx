interface RuleListProps {
  children: React.ReactNode;
}

export function RuleList({ children }: RuleListProps) {
  return (
    <div className="rounded border border-border overflow-hidden">
      {children}
    </div>
  );
}
