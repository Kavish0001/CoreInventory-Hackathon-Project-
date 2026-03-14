import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError, selectAuth } from '../features/auth/authSlice';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(selectAuth);

  useEffect(() => {
    dispatch(clearAuthError());
    if (user) navigate('/');
  }, [user, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-primary p-3 rounded-2xl shadow-lg">
            <Package size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-text-primary tracking-tight">CoreInventory</h2>
        <p className="mt-2 text-sm text-text-secondary">Enterprise Inventory Management</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-[var(--shadow-card)] border border-border sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-text-primary mb-1">Email or Login ID</label>
              <input
                id="identifier"
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">Password</label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {error && (
              <div className="bg-danger-light border border-danger/20 text-danger text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-text-secondary">Don't have an account? </span>
            <Link to="/signup" className="font-medium text-primary hover:text-primary-dark transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
