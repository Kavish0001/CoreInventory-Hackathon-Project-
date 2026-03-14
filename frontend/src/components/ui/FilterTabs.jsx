export default function FilterTabs({ tabs, active, onChange, counts = {} }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        const count = counts[tab.id];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-text-secondary border-border hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {count !== undefined && (
              <span className={`ml-1.5 text-xs ${isActive ? 'text-white/80' : 'text-text-muted'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
