import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { KeyRound } from 'lucide-react';
import { isValidEmail, passwordRules, validatePassword } from '../utils/authValidation';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const RuleItem = ({ ok, children }) => (
  <li className={cx('text-xs', ok ? 'text-green-700' : 'text-gray-500')}>{children}</li>
);

const ForgotPasswordPage = () => {
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);
    if (!result.success) return setError(result.error);
    setInfo(result.data?.reset_code ? `Reset code (dev): ${result.data.reset_code}` : result.data?.message);
    setStep('reset');
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }

    if (!code.trim()) {
      setError('Reset code is required');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setLoading(true);
    const result = await resetPassword({ email, code, new_password: newPassword });
    setLoading(false);
    if (!result.success) return setError(result.error);
    setInfo(result.data?.message || 'Password updated');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
            <KeyRound className="w-8 h-8 text-blue-600" /> Reset password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Uses local reset codes (no email/SMS provider)
          </p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">{error}</div>}
        {info && <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded relative">{info}</div>}

        {step === 'request' ? (
          <form className="space-y-4" onSubmit={handleRequest}>
            <input
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && (
              <div className={cx('text-xs', isValidEmail(email) ? 'text-green-700' : 'text-red-600')}>
                {isValidEmail(email) ? 'Email looks good' : 'Enter a valid email address'}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate reset code'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleReset}>
            <input
              type="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && (
              <div className={cx('text-xs', isValidEmail(email) ? 'text-green-700' : 'text-red-600')}>
                {isValidEmail(email) ? 'Email looks good' : 'Enter a valid email address'}
              </div>
            )}
            <input
              type="text"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Reset code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <input
              type="password"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="bg-white border border-gray-200 rounded-md p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Password rules</p>
              {(() => {
                const pwd = passwordRules(newPassword);
                return (
                  <ul className="space-y-1">
                    <RuleItem ok={pwd.minLen}>At least 8 characters</RuleItem>
                    <RuleItem ok={pwd.lower}>One lowercase letter</RuleItem>
                    <RuleItem ok={pwd.upper}>One uppercase letter</RuleItem>
                    <RuleItem ok={pwd.number}>One number</RuleItem>
                    <RuleItem ok={pwd.special}>One special character</RuleItem>
                  </ul>
                );
              })()}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
