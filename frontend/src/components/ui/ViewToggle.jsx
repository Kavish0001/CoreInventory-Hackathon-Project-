import { List, LayoutGrid } from 'lucide-react';

export default function ViewToggle({ view, onChange }) {
  const btn = (mode, Icon) => (
    <button
      type="button"
      onClick={() => onChange(mode)}
      className={`p-2 rounded-lg border text-sm transition-colors ${
        view === mode
          ? 'bg-primary text-white border-primary'
          : 'bg-white text-text-secondary border-border hover:bg-gray-50'
      }`}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="flex items-center gap-1">
      {btn('list', List)}
      {btn('kanban', LayoutGrid)}
    </div>
  );
}
