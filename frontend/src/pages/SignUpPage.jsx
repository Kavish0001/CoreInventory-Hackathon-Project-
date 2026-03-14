import { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { isValidEmail, passwordRules, validateLoginId, validatePassword } from '../utils/authValidation';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const RuleItem = ({ ok, children }) => (
  <li className={cx('text-xs', ok ? 'text-green-700' : 'text-gray-500')}>{children}</li>
);

RuleItem.propTypes = {
  ok: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired
};

const SignUpPage = () => {
  const [form, setForm] = useState({ name: '', login_id: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    const loginIdError = validateLoginId(form.login_id);
    if (loginIdError) {
      setLoading(false);
      setError(loginIdError);
      return;
    }

    if (!isValidEmail(form.email)) {
      setLoading(false);
      setError('Enter a valid email address');
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setLoading(false);
      setError(passwordError);
      return;
    }

    if (form.password !== form.confirm) {
      setLoading(false);
      setError('Passwords do not match');
      return;
    }

    const result = await register({
      name: form.name,
      ...(form.login_id.trim() ? { login_id: form.login_id } : {}),
      email: form.email,
      password: form.password,
    });

    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  const pwd = passwordRules(form.password);
  const canSubmit =
    !loading &&
    form.name.trim().length > 0 &&
    (!form.login_id || !validateLoginId(form.login_id)) &&
    isValidEmail(form.email) &&
    !validatePassword(form.password) &&
    form.password === form.confirm;

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="ci-shell w-full max-w-5xl grid md:grid-cols-2 overflow-hidden">
        <div className="hidden md:flex flex-col justify-between bg-violet-700 p-10 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-violet-200">CoreInventory</p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Create your workspace account</h2>
            <p className="mt-4 text-sm text-violet-100">Start tracking products, receipts, transfers and deliveries with a single unified dashboard.</p>
          </div>
          <div className="text-xs text-violet-200">Fast setup. Role based access. Unified stock visibility.</div>
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-violet-700" /> Create account
          </h2>
          <p className="mt-2 text-sm text-slate-500">Set up your profile and continue to dashboard</p>

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

          <input
            type="text"
            required
            className="ci-input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            type="text"
            className="ci-input"
            placeholder="Login ID (6-12 chars)"
            value={form.login_id}
            onChange={(e) => setForm((p) => ({ ...p, login_id: e.target.value }))}
          />
          {form.login_id && (
            <div className={cx('text-xs', validateLoginId(form.login_id) ? 'text-red-600' : 'text-green-700')}>
              {validateLoginId(form.login_id) || 'Login ID looks good'}
            </div>
          )}
          <input
            type="email"
            required
            className="ci-input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          {form.email && (
            <div className={cx('text-xs', isValidEmail(form.email) ? 'text-green-700' : 'text-red-600')}>
              {isValidEmail(form.email) ? 'Email looks good' : 'Enter a valid email address'}
            </div>
          )}
          <input
            type="password"
            required
            className="ci-input"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
          <div className="bg-white border border-gray-200 rounded-md p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Password rules</p>
            <ul className="space-y-1">
              <RuleItem ok={pwd.minLen}>At least 8 characters</RuleItem>
              <RuleItem ok={pwd.lower}>One lowercase letter</RuleItem>
              <RuleItem ok={pwd.upper}>One uppercase letter</RuleItem>
              <RuleItem ok={pwd.number}>One number</RuleItem>
              <RuleItem ok={pwd.special}>One special character</RuleItem>
            </ul>
          </div>
          <input
            type="password"
            required
            className="ci-input"
            placeholder="Re-enter password"
            value={form.confirm}
            onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
          />
          {form.confirm && (
            <div className={cx('text-xs', form.password === form.confirm ? 'text-green-700' : 'text-red-600')}>
              {form.password === form.confirm ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="ci-button-primary w-full py-2.5"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account? <Link to="/login" className="text-violet-700 hover:text-violet-800 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
