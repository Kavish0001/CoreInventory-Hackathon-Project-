import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportService } from '../../services/api';

export const fetchStock = createAsyncThunk('stock/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await reportService.getStockSnapshot(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load stock');
  }
});

const stockSlice = createSlice({
  name: 'stock',
  initialState: {
    items: [],
    loading: false,
    error: null,
    searchTerm: '',
  },
  reducers: {
    setStockSearch(state, { payload }) {
      state.searchTerm = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchStock.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchStock.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload; });
    builder.addCase(fetchStock.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
  },
});

export const { setStockSearch } = stockSlice.actions;
export const selectStock = (state) => state.stock;
export default stockSlice.reducer;
