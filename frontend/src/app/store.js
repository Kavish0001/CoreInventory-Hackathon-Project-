import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice';
import productsReducer from '../features/products/productsSlice';
import receiptsReducer from '../features/inventory/receiptsSlice';
import deliveriesReducer from '../features/inventory/deliveriesSlice';
import moveHistoryReducer from '../features/inventory/moveHistorySlice';
import warehousesReducer from '../features/warehouses/warehousesSlice';
import stockReducer from '../features/stock/stockSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    products: productsReducer,
    receipts: receiptsReducer,
    deliveries: deliveriesReducer,
    moveHistory: moveHistoryReducer,
    warehouses: warehousesReducer,
    stock: stockReducer,
  },
});

export default store;
