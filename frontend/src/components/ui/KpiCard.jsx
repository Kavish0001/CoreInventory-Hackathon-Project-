export default function KpiCard({ title, value, icon: Icon, color = 'primary', trend, subtitle, onClick }) {
  const COLOR_MAP = {
    primary: { bg: 'bg-primary-light', icon: 'text-primary', border: 'border-primary/10' },
    danger: { bg: 'bg-danger-light', icon: 'text-danger', border: 'border-danger/10' },
    warning: { bg: 'bg-warning-light', icon: 'text-warning', border: 'border-warning/10' },
    success: { bg: 'bg-success-light', icon: 'text-success', border: 'border-success/10' },
    accent: { bg: 'bg-accent-light', icon: 'text-accent', border: 'border-accent/10' },
    info: { bg: 'bg-info-light', icon: 'text-info', border: 'border-info/10' },
  };

  const c = COLOR_MAP[color] || COLOR_MAP.primary;

  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-xl border ${c.border} p-5 shadow-[var(--shadow-card)] hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trend > 0 ? 'text-success' : 'text-danger'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {Icon && (
          <div className={`${c.bg} p-3 rounded-xl`}>
            <Icon size={22} className={c.icon} />
          </div>
        )}
      </div>
    </div>
  );
}
