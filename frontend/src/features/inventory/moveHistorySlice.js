import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryService } from '../../services/api';

export const fetchMoveHistory = createAsyncThunk('moveHistory/fetchAll', async (params, { rejectWithValue }) => {
  try {
    const res = await inventoryService.getMoveHistory(params);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load move history');
  }
});

const moveHistorySlice = createSlice({
  name: 'moveHistory',
  initialState: {
    items: [],
    loading: false,
    error: null,
    searchTerm: '',
  },
  reducers: {
    setMoveHistorySearch(state, { payload }) {
      state.searchTerm = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMoveHistory.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchMoveHistory.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload; });
    builder.addCase(fetchMoveHistory.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
  },
});

export const { setMoveHistorySearch } = moveHistorySlice.actions;
export const selectMoveHistory = (state) => state.moveHistory;
export default moveHistorySlice.reducer;
