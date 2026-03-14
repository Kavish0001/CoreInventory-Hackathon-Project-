import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRoleLabel } from '../utils/rbac';
import { useSelector } from 'react-redux';
import { selectAuth } from '../features/auth/authSlice';

export default function NotAuthorized() {
  const { user } = useSelector(selectAuth);

  return (
    <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-10">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-danger-light text-danger border border-danger/20">
          <ShieldAlert size={22} />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text-primary">Access denied</h1>
          <p className="text-sm text-text-secondary mt-1">
            Your role <span className="font-medium text-text-primary">{getRoleLabel(user?.role)}</span> does not have permission to view this page.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-border bg-white text-text-secondary text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              View Role Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

