import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { KeyRound } from 'lucide-react';
import { isValidEmail, passwordRules, validatePassword } from '../utils/authValidation';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const RuleItem = ({ ok, children }) => (
  <li className={cx('text-xs', ok ? 'text-green-700' : 'text-gray-500')}>{children}</li>
);

RuleItem.propTypes = {
  ok: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired
};

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
    <div className="min-h-screen grid place-items-center p-4">
      <div className="ci-shell w-full max-w-5xl grid md:grid-cols-2 overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-violet-700 p-10 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-200">CoreInventory</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Recover account access securely</h2>
            <p className="mt-4 text-sm text-violet-100">Generate a local reset code and update your password with policy checks enabled.</p>
          </div>
          <div className="text-xs text-violet-200">No third-party service required for development reset flow.</div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-violet-700" /> Reset password
          </h2>
          <p className="mt-2 text-sm text-slate-500">Request code and set a new secure password</p>

          {error && <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {info && <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{info}</div>}

          {step === 'request' ? (
            <form className="mt-6 space-y-4" onSubmit={handleRequest}>
            <input
              type="email"
              required
              className="ci-input"
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
              className="ci-button-primary w-full py-2.5"
            >
              {loading ? 'Generating...' : 'Generate reset code'}
            </button>
          </form>
        ) : (
            <form className="mt-6 space-y-4" onSubmit={handleReset}>
            <input
              type="email"
              required
              className="ci-input"
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
              className="ci-input"
              placeholder="Reset code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <input
              type="password"
              required
              className="ci-input"
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
              className="ci-button-primary w-full py-2.5"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

          <p className="mt-6 text-center text-sm text-slate-600">
            <Link to="/login" className="text-violet-700 hover:text-violet-800 font-medium">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
