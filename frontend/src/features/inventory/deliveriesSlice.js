import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '../../services/api';

export const fetchDeliveries = createAsyncThunk('deliveries/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await inventoryService.listDeliveries(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load deliveries');
  }
});

export const fetchDelivery = createAsyncThunk('deliveries/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await inventoryService.getDelivery(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load delivery');
  }
});

export const createDelivery = createAsyncThunk('deliveries/create', async (data, { rejectWithValue }) => {
  try {
    const res = await inventoryService.createDelivery(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create delivery');
  }
});

export const confirmDelivery = createAsyncThunk('deliveries/confirm', async (id, { rejectWithValue }) => {
  try {
    const res = await inventoryService.confirmDelivery(id);
    return { id, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to confirm delivery');
  }
});

export const validateDelivery = createAsyncThunk('deliveries/validate', async (id, { rejectWithValue }) => {
  try {
    const res = await inventoryService.validateDelivery(id);
    return { id, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to validate delivery');
  }
});

const deliveriesSlice = createSlice({
  name: 'deliveries',
  initialState: {
    items: [],
    currentDelivery: null,
    loading: false,
    detailLoading: false,
    error: null,
    filters: { q: '', status: '', tab: 'all' },
  },
  reducers: {
    setDeliveryFilters(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
    clearCurrentDelivery(state) {
      state.currentDelivery = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDeliveries.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchDeliveries.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload; });
    builder.addCase(fetchDeliveries.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    builder.addCase(fetchDelivery.pending, (state) => { state.detailLoading = true; });
    builder.addCase(fetchDelivery.fulfilled, (state, { payload }) => { state.detailLoading = false; state.currentDelivery = payload; });
    builder.addCase(fetchDelivery.rejected, (state, { payload }) => { state.detailLoading = false; state.error = payload; });
    builder.addCase(confirmDelivery.fulfilled, (state, { payload }) => {
      const idx = state.items.findIndex((d) => d.id === payload.id);
      if (idx !== -1) state.items[idx].status = payload.status;
      if (state.currentDelivery?.delivery?.id === payload.id) state.currentDelivery.delivery.status = payload.status;
    });
    builder.addCase(validateDelivery.fulfilled, (state, { payload }) => {
      const idx = state.items.findIndex((d) => d.id === payload.id);
      if (idx !== -1) state.items[idx].status = payload.status;
      if (state.currentDelivery?.delivery?.id === payload.id) state.currentDelivery.delivery.status = payload.status;
    });
  },
});

export const { setDeliveryFilters, clearCurrentDelivery } = deliveriesSlice.actions;
export const selectDeliveries = (state) => state.deliveries;
export default deliveriesSlice.reducer;
