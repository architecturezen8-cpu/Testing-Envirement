interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
}

export function StatCard({ label, value, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-surface p-6">
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-stone-950">{value}</p>
      {trend && <p className="mt-1 text-xs text-stone-500">{trend}</p>}
    </div>
  );
}
