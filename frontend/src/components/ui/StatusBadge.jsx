const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  waiting: 'bg-warning-light text-amber-800',
  ready: 'bg-success-light text-green-800',
  done: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-danger-light text-red-800',
  late: 'bg-danger-light text-red-700',
  in_stock: 'bg-success-light text-green-800',
  low_stock: 'bg-warning-light text-amber-800',
  out_of_stock: 'bg-danger-light text-red-800',
};

const SIZE_MAP = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const LABELS = {
  draft: 'Draft',
  waiting: 'Waiting',
  ready: 'Ready',
  done: 'Done',
  cancelled: 'Cancelled',
  late: 'Late',
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

export default function StatusBadge({ status, size = 'md', label }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.draft;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const text = label || LABELS[status] || status;

  return (
    <span className={`inline-flex items-center font-semibold rounded-full capitalize whitespace-nowrap ${style} ${sizeClass}`}>
      {text}
    </span>
  );
}
