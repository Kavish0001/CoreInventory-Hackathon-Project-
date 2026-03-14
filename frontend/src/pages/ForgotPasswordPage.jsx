import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { forgotPassword, clearAuthError, selectAuth } from '../features/auth/authSlice';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const dispatch = useDispatch();
  const { loading, error } = useSelector(selectAuth);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(forgotPassword(email)).unwrap();
      setSuccess(true);
    } catch {
      // error handled by slice
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <img src="/image.png" alt="CoreInventory Logo" className="h-20 w-20 drop-shadow-md rounded-[14px]" />
        </div>
        <h2 className="text-3xl font-bold text-text-primary tracking-tight">Recover Password</h2>
        <p className="mt-2 text-sm text-text-secondary">We'll send you an OTP to reset your password.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow-[var(--shadow-card)] border border-border sm:rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center">
              <div className="bg-success-light border border-success/20 text-success text-sm rounded-lg p-4 mb-6">
                Recovery email sent! Please check your inbox for the OTP.
              </div>
              <Link
                to="/login"
                className="w-full flex justify-center py-2.5 px-4 border border-border rounded-lg shadow-sm text-sm font-medium text-text-primary bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-1">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? 'Sending...' : 'Send Recovery Email'}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="font-medium text-text-secondary hover:text-primary transition-colors flex items-center justify-center gap-1">
                &larr; Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
