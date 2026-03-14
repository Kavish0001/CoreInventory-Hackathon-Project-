export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const email = value.trim();
  if (!email) return false;
  // Reasonable, non-exhaustive email format check (frontend only).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLoginId(value) {
  if (!value) return null; // optional
  const loginId = String(value).trim();
  if (loginId.length < 6 || loginId.length > 12) return 'Login ID must be 6-12 characters';
  if (!/^[A-Za-z0-9_]+$/.test(loginId)) return 'Login ID can contain letters, numbers, and underscore only';
  return null;
}

export function passwordRules(password) {
  const p = String(password || '');
  return {
    minLen: p.length >= 8,
    lower: /[a-z]/.test(p),
    upper: /[A-Z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p),
  };
}

export function validatePassword(password) {
  const r = passwordRules(password);
  if (!r.minLen) return 'Password must be at least 8 characters';
  if (!r.lower) return 'Password must include a lowercase letter';
  if (!r.upper) return 'Password must include an uppercase letter';
  if (!r.number) return 'Password must include a number';
  if (!r.special) return 'Password must include a special character';
  return null;
}

