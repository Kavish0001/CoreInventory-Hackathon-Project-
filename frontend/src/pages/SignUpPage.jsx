import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError, selectAuth } from '../features/auth/authSlice';

export default function SignUpPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'warehouse_staff' });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector(selectAuth);

  useEffect(() => {
    dispatch(clearAuthError());
    if (user) navigate('/');
  }, [user, navigate, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };



  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img src="/image.png" alt="CoreInventory Logo" className="h-20 w-20 drop-shadow-md rounded-[14px]" />
        </div>
        <h2 className="text-3xl font-bold text-text-primary tracking-tight">Create an account</h2>
        <p className="mt-2 text-sm text-text-secondary">Join CoreInventory</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-[var(--shadow-card)] border border-border sm:rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-1">Full Name</label>
              <input
                id="name"
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">Email address</label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-1">Role</label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="warehouse_staff">Warehouse Staff</option>
                <option value="manager">Inventory Manager</option>
              </select>
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
              {loading ? 'Creating account...' : 'Sign up'}
            </button>


          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-text-secondary">Already have an account? </span>
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
