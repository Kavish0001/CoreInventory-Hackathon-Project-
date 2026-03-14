import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productService } from '../../services/api';

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await productService.getProducts();
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load products');
  }
});

export const createProduct = createAsyncThunk('products/create', async (data, { rejectWithValue }) => {
  try {
    const res = await productService.createProduct(data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('products/update', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await productService.updateProduct(id, data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update product');
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    searchTerm: '',
  },
  reducers: {
    setProductSearch(state, { payload }) {
      state.searchTerm = payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; });
    builder.addCase(fetchProducts.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload; });
    builder.addCase(fetchProducts.rejected, (state, { payload }) => { state.loading = false; state.error = payload; });
    builder.addCase(createProduct.fulfilled, (state, { payload }) => { state.items.push(payload); });
    builder.addCase(updateProduct.fulfilled, (state, { payload }) => {
      const idx = state.items.findIndex((p) => p.id === payload.id);
      if (idx !== -1) state.items[idx] = payload;
    });
  },
});

export const { setProductSearch } = productsSlice.actions;
export const selectProducts = (state) => state.products;
export default productsSlice.reducer;
