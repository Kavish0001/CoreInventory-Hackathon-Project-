import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportService } from '../../services/api';

export const fetchDashboardStats = createAsyncThunk('dashboard/fetchStats', async (_, { rejectWithValue }) => {
  try {
    const res = await reportService.getDashboardStats();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load dashboard');
  }
});

export const fetchLowStockAlerts = createAsyncThunk('dashboard/fetchLowStock', async (_, { rejectWithValue }) => {
  try {
    const res = await reportService.getLowStockAlerts();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load alerts');
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    stats: null,
    lowStockAlerts: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchDashboardStats.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchDashboardStats.fulfilled, (state, { payload }) => { state.loading = false; state.stats = payload; });
    builder.addCase(fetchDashboardStats.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    builder.addCase(fetchLowStockAlerts.fulfilled, (state, { payload }) => { state.lowStockAlerts = payload; });
  },
});

export const selectDashboard = (state) => state.dashboard;
export default dashboardSlice.reducer;
