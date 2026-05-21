import { getStatusLabel, getStatusColor, STATUS_COLOR_CLASSES } from '@/lib/helpers';

export function StatusBadge({ status }: { status: string }) {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLOR_CLASSES[color]}`}>
      {label}
    </span>
  );
}
