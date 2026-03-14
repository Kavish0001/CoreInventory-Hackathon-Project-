import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '../../services/api';

export const fetchReceipts = createAsyncThunk('receipts/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await inventoryService.listReceipts(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load receipts');
  }
});

export const fetchReceipt = createAsyncThunk('receipts/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await inventoryService.getReceipt(id);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load receipt');
  }
});

export const createReceipt = createAsyncThunk('receipts/create', async (data, { rejectWithValue }) => {
  try {
    const res = await inventoryService.createReceipt(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create receipt');
  }
});

export const confirmReceipt = createAsyncThunk('receipts/confirm', async (id, { rejectWithValue }) => {
  try {
    const res = await inventoryService.confirmReceipt(id);
    return { id, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to confirm receipt');
  }
});

export const validateReceipt = createAsyncThunk('receipts/validate', async (id, { rejectWithValue }) => {
  try {
    const res = await inventoryService.validateReceipt(id);
    return { id, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to validate receipt');
  }
});

const receiptsSlice = createSlice({
  name: 'receipts',
  initialState: {
    items: [],
    currentReceipt: null,
    loading: false,
    detailLoading: false,
    error: null,
    filters: { q: '', status: '', tab: 'all' },
  },
  reducers: {
    setReceiptFilters(state, { payload }) {
      state.filters = { ...state.filters, ...payload };
    },
    clearCurrentReceipt(state) {
      state.currentReceipt = null;
    },
  },
  extraReducers: (builder) => {
    // list
    builder.addCase(fetchReceipts.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchReceipts.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload; });
    builder.addCase(fetchReceipts.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    // single
    builder.addCase(fetchReceipt.pending, (state) => { state.detailLoading = true; });
    builder.addCase(fetchReceipt.fulfilled, (state, { payload }) => { state.detailLoading = false; state.currentReceipt = payload; });
    builder.addCase(fetchReceipt.rejected, (state, { payload }) => { state.detailLoading = false; state.error = payload; });
    // confirm
    builder.addCase(confirmReceipt.fulfilled, (state, { payload }) => {
      const idx = state.items.findIndex((r) => r.id === payload.id);
      if (idx !== -1) state.items[idx].status = payload.status;
      if (state.currentReceipt?.receipt?.id === payload.id) state.currentReceipt.receipt.status = payload.status;
    });
    // validate
    builder.addCase(validateReceipt.fulfilled, (state, { payload }) => {
      const idx = state.items.findIndex((r) => r.id === payload.id);
      if (idx !== -1) state.items[idx].status = payload.status;
      if (state.currentReceipt?.receipt?.id === payload.id) state.currentReceipt.receipt.status = payload.status;
    });
  },
});

export const { setReceiptFilters, clearCurrentReceipt } = receiptsSlice.actions;
export const selectReceipts = (state) => state.receipts;
export default receiptsSlice.reducer;
