import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/client';

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, { rejectWithValue }) => {
  try {
    const response = await API.get('/wishlist');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggleWishlist', async (productId, { rejectWithValue }) => {
  try {
    const response = await API.post('/wishlist', { productId });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response.data);
  }
});

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch wishlist';
      })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        state.items = action.payload.items;
      });
  },
});

export default wishlistSlice.reducer;
