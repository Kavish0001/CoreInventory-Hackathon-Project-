import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '../../services/api';

// ── Thunks ──
export const loginUser = createAsyncThunk('auth/login', async ({ identifier, password }, { rejectWithValue }) => {
  try {
    const res = await authService.login(identifier, password);
    const { user, token } = res.data;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    return { user, token };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const res = await authService.register(payload);
    const { user, token } = res.data;
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    return { user, token };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const res = await authService.forgotPassword(email);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Request failed');
  }
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async (payload, { rejectWithValue }) => {
  try {
    const res = await authService.resetPassword(payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Reset failed');
  }
});

// ── Helpers ──
function loadUserFromStorage() {
  try {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) return { user: JSON.parse(storedUser), token };
  } catch { /* ignore */ }
  return { user: null, token: null };
}

const persisted = loadUserFromStorage();

// ── Slice ──
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: persisted.user,
    token: persisted.token,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // login
    builder.addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(loginUser.fulfilled, (state, { payload }) => { state.loading = false; state.user = payload.user; state.token = payload.token; });
    builder.addCase(loginUser.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    // register
    builder.addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(registerUser.fulfilled, (state, { payload }) => { state.loading = false; state.user = payload.user; state.token = payload.token; });
    builder.addCase(registerUser.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    // forgotPassword
    builder.addCase(forgotPassword.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(forgotPassword.fulfilled, (state) => { state.loading = false; });
    builder.addCase(forgotPassword.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    // resetPassword
    builder.addCase(resetPassword.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(resetPassword.fulfilled, (state) => { state.loading = false; });
    builder.addCase(resetPassword.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export const selectAuth = (state) => state.auth;
export default authSlice.reducer;
