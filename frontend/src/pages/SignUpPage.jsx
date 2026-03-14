import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { isValidEmail, passwordRules, validateLoginId, validatePassword } from '../utils/authValidation';

const cx = (...parts) => parts.filter(Boolean).join(' ');

const RuleItem = ({ ok, children }) => (
  <li className={cx('text-xs', ok ? 'text-green-700' : 'text-gray-500')}>{children}</li>
);

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
      login_id: form.login_id,
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-2">
            <UserPlus className="w-8 h-8 text-blue-600" /> Create account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Minimal local auth (no 3rd-party APIs)
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded relative">
              {info}
            </div>
          )}

          <input
            type="text"
            required
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            type="text"
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
