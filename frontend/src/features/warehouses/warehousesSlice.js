import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { warehouseService } from '../../services/api';

export const fetchWarehouses = createAsyncThunk('warehouses/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await warehouseService.getWarehouses();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load warehouses');
  }
});

export const createWarehouse = createAsyncThunk('warehouses/create', async (data, { rejectWithValue }) => {
  try {
    const res = await warehouseService.createWarehouse(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create warehouse');
  }
});

export const fetchLocations = createAsyncThunk('warehouses/fetchLocations', async (warehouseId, { rejectWithValue }) => {
  try {
    const res = await warehouseService.getLocations(warehouseId);
    return { warehouseId, locations: res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load locations');
  }
});

export const createLocation = createAsyncThunk('warehouses/createLocation', async (data, { rejectWithValue }) => {
  try {
    const res = await warehouseService.createLocation(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create location');
  }
});

const warehousesSlice = createSlice({
  name: 'warehouses',
  initialState: {
    items: [],
    locations: [],
    selectedWarehouseId: null,
    loading: false,
    error: null,
  },
  reducers: {
    setSelectedWarehouse(state, { payload }) {
      state.selectedWarehouseId = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchWarehouses.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchWarehouses.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload; });
    builder.addCase(fetchWarehouses.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    builder.addCase(createWarehouse.fulfilled, (state, { payload }) => { state.items.push(payload); });
    builder.addCase(fetchLocations.fulfilled, (state, { payload }) => { state.locations = payload.locations; });
    builder.addCase(createLocation.fulfilled, (state, { payload }) => { state.locations.push(payload); });
  },
});

export const { setSelectedWarehouse } = warehousesSlice.actions;
export const selectWarehouses = (state) => state.warehouses;
export default warehousesSlice.reducer;
