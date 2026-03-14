const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const { getConfig } = require('../utils/env');
const sendEmail = require('../utils/email');

function validatePasswordStrength(password) {
  if (typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
  if (!/\d/.test(password)) return 'Password must include a number';
  if (!/[^A-Za-z\d]/.test(password)) return 'Password must include a special character';
  return null;
}

function validateLoginId(loginId) {
  if (loginId == null) return null;
  if (typeof loginId !== 'string') return 'Login ID must be a string';
  const trimmed = loginId.trim();
  if (trimmed === '') return null;
  if (trimmed.length < 6 || trimmed.length > 12) return 'Login ID must be 6-12 characters';
  if (!/^\w+$/.test(trimmed)) return 'Login ID can contain letters, numbers, and underscore only';
  return null;
}

exports.register = async (req, res) => {
  const { name, email, login_id, password, role } = req.body;

  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name || String(name).trim() === '') return res.status(400).json({ message: 'Name is required' });
    if (!normalizedEmail) return res.status(400).json({ message: 'Email is required' });

    const loginIdError = validateLoginId(login_id);
    if (loginIdError) return res.status(400).json({ message: loginIdError });
    const passwordError = validatePasswordStrength(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const loginIdTrimmed = typeof login_id === 'string' ? login_id.trim() : null;

    const userExists = await db.query('SELECT 1 FROM users WHERE email = $1', [normalizedEmail]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (loginIdTrimmed) {
      const loginIdExists = await db.query('SELECT 1 FROM users WHERE login_id = $1', [loginIdTrimmed]);
      if (loginIdExists.rows.length > 0) {
        return res.status(400).json({ message: 'Login ID already exists' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (name, login_id, email, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, login_id, email, role',
      [String(name).trim(), loginIdTrimmed || null, normalizedEmail, passwordHash, role || 'user']
    );

    const config = getConfig();
    const token = jwt.sign({ user_id: newUser.rows[0].id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.status(201).json({ user: newUser.rows[0], token });
  } catch (err) {
    // Handle unique constraint races cleanly
    if (err?.code === '23505') {
      return res.status(400).json({ message: 'Email or Login ID already exists' });
    }

    console.error(err);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({ message: isProduction ? 'Server error' : (err.message || 'Server error') });
  }
};

exports.login = async (req, res) => {
  const { email, login_id, password } = req.body;

  try {
    const identifier = (login_id || email || '').trim();
    if (!identifier) return res.status(400).json({ message: 'Email or Login ID is required' });

    const normalized = identifier.includes('@') ? identifier.toLowerCase() : identifier;
    const user = await db.query('SELECT * FROM users WHERE email = $1 OR login_id = $1', [normalized]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const config = getConfig();
    const token = jwt.sign({ user_id: user.rows[0].id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    res.json({
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        login_id: user.rows[0].login_id,
        email: user.rows[0].email,
        role: user.rows[0].role
      },
      token
    });
  } catch (err) {
    console.error(err);
    const isProduction = process.env.NODE_ENV === 'production';
    res.status(500).json({ message: isProduction ? 'Server error' : (err.message || 'Server error') });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const identifier = (email || '').trim();
  if (!identifier) return res.status(400).json({ message: 'Email is required' });

  try {
    const user = await db.query('SELECT id FROM users WHERE email = $1', [identifier]);

    // Always return success to avoid user enumeration
    if (user.rows.length === 0) {
      return res.json({ message: 'If the account exists, a reset code has been generated.' });
    }

    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(resetCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.query(
      'INSERT INTO password_reset_codes (user_id, code_hash, expires_at) VALUES ($1, $2, $3)',
      [user.rows[0].id, codeHash, expiresAt]
    );

    const message = `You are receiving this email because you (or someone else) have requested the reset of a password. \n\n Your password reset code is: ${resetCode} \n\n This code will expire in 10 minutes.`;

    try {
      await sendEmail({
        email: identifier,
        subject: 'Password Reset Code - CoreInventory',
        message: message,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #73579b;">Password Reset Request</h2>
            <p>You requested a password reset. Use the code below to reset your password:</p>
            <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; border-radius: 8px; margin: 20px 0;">
              ${resetCode}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
            <p style="font-size: 12px; color: #999;">CoreInventory Team</p>
          </div>
        `
      });

      res.json({ message: 'If the account exists, a reset code has been sent to your email.' });
    } catch (err) {
      console.warn('Email send failed, falling back to response code for DEV mode:', err.message);
      
      const includeCode = process.env.NODE_ENV !== 'production';
      res.json({
        message: 'If the account exists, a reset code has been generated.',
        error: 'Email delivery failed. ' + (includeCode ? 'Check reset_code in response.' : 'Please contact support.'),
        ...(includeCode ? { reset_code: resetCode } : {})
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, code } = req.body;

  const identifier = (email || '').trim();
  const resetCode = (code || '').trim();

  if (!identifier) return res.status(400).json({ message: 'Email is required' });
  if (!resetCode) return res.status(400).json({ message: 'Reset code is required' });

  try {
    const user = await db.query('SELECT id FROM users WHERE email = $1', [identifier.toLowerCase()]);
    if (user.rows.length === 0) return res.status(400).json({ message: 'Invalid reset code' });

    const codeRow = await db.query(
      `SELECT id, code_hash, expires_at
       FROM password_reset_codes
       WHERE user_id = $1 AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.rows[0].id]
    );

    if (codeRow.rows.length === 0) return res.status(400).json({ message: 'Invalid reset code' });

    const { code_hash: codeHash, expires_at: expiresAt } = codeRow.rows[0];
    if (new Date(expiresAt).getTime() < Date.now()) return res.status(400).json({ message: 'Reset code expired' });

    const isMatch = await bcrypt.compare(resetCode, codeHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid reset code' });

    return res.json({ message: 'OTP verified' });
  } catch (err) {
    console.error(err);
    const isProduction = process.env.NODE_ENV === 'production';
    return res.status(500).json({ message: isProduction ? 'Server error' : (err.message || 'Server error') });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, code, new_password } = req.body;

  const identifier = (email || '').trim();
  const resetCode = (code || '').trim();

  if (!identifier) return res.status(400).json({ message: 'Email is required' });
  if (!resetCode) return res.status(400).json({ message: 'Reset code is required' });

  const passwordError = validatePasswordStrength(new_password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  try {
    const user = await db.query('SELECT id FROM users WHERE email = $1', [identifier]);
    if (user.rows.length === 0) return res.status(400).json({ message: 'Invalid reset code' });

    const codeRow = await db.query(
      `SELECT id, code_hash, expires_at
       FROM password_reset_codes
       WHERE user_id = $1 AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [user.rows[0].id]
    );

    if (codeRow.rows.length === 0) return res.status(400).json({ message: 'Invalid reset code' });

    const { id: codeId, code_hash: codeHash, expires_at: expiresAt } = codeRow.rows[0];
    if (new Date(expiresAt).getTime() < Date.now()) return res.status(400).json({ message: 'Reset code expired' });

    const isMatch = await bcrypt.compare(resetCode, codeHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid reset code' });

    const passwordHash = await bcrypt.hash(new_password, 10);

    await db.query('BEGIN');
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user.rows[0].id]);
    await db.query('UPDATE password_reset_codes SET used_at = CURRENT_TIMESTAMP WHERE id = $1', [codeId]);
    await db.query('COMMIT');

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    await db.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server error');
  }
};
