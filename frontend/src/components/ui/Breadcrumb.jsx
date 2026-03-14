import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <div key={item.label} className="flex items-center gap-1">
            {item.to && !isLast ? (
              <Link to={item.to} className="text-text-muted hover:text-primary transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-text-primary font-medium' : 'text-text-muted'}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} className="text-text-muted" />}
          </div>
        );
      })}
    </nav>
  );
}
