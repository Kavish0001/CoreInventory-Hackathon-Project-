import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { isValidEmail } from '../utils/authValidation';

const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const trimmed = identifier.trim();
    if (!trimmed) {
      setLoading(false);
      setError('Email or Login ID is required');
      return;
    }

    if (trimmed.includes('@') && !isValidEmail(trimmed)) {
      setLoading(false);
      setError('Enter a valid email address');
      return;
    }

    const result = await login(trimmed, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const canSubmit = !loading && identifier.trim().length > 0 && password.length > 0;

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="ci-shell w-full max-w-5xl grid md:grid-cols-2 overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-violet-700 p-10 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-200">CoreInventory</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Manage inventory with speed and clarity</h2>
            <p className="mt-4 text-sm text-violet-100">Track receipts, deliveries, stock levels, and movement history from one dashboard.</p>
          </div>
          <div className="text-xs text-violet-200">Warehouse, products, operations and reporting in one flow.</div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <LogIn className="w-6 h-6 text-violet-700" /> Sign in
          </h2>
          <p className="mt-2 text-sm text-slate-500">Use email or login ID to continue</p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {info}
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text"
                required
                className="ci-input"
                placeholder="Email or Login ID"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
              <input
                type="password"
                required
                className="ci-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="ci-button-primary w-full py-2.5"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="flex justify-between text-sm">
              <Link to="/forgot-password" className="text-violet-700 hover:text-violet-800 font-medium">Forgot password?</Link>
              <Link to="/signup" className="text-violet-700 hover:text-violet-800 font-medium">Sign up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
