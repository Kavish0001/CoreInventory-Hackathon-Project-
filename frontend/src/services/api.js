import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  // Supports passing either (identifier, password) or a credentials object { email | login_id, password }
  login: (identifierOrCredentials, password) => {
    if (typeof identifierOrCredentials === 'object' && identifierOrCredentials !== null) {
      return api.post('/auth/login', identifierOrCredentials);
    }
    return api.post('/auth/login', { email: identifierOrCredentials, password });
  },
  register: (userData) => api.post('/auth/register', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOTP: (payload) => api.post('/auth/verify-otp', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const productService = {
  getProducts: () => api.get('/products'),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  getProduct: (id) => api.get(`/products/${id}`),
};

export const warehouseService = {
  getWarehouses: () => api.get('/warehouses'),
  createWarehouse: (warehouseData) => api.post('/warehouses', warehouseData),
  getLocations: (warehouseId) => api.get(`/warehouses/${warehouseId}/locations`),
  createLocation: (locationData) => api.post('/warehouses/locations', locationData),
};

export const inventoryService = {
  listReceipts: (params) => api.get('/inventory/receipts', { params }),
  listDeliveries: (params) => api.get('/inventory/deliveries', { params }),
  getReceipt: (id) => api.get(`/inventory/receipts/${id}`),
  getDelivery: (id) => api.get(`/inventory/deliveries/${id}`),
  getMoveHistory: (params) => api.get('/inventory/move-history', { params }),
  createReceipt: (data) => api.post('/inventory/receipts', data),
  markReceiptAsTodo: (id) => api.post(`/inventory/receipts/${id}/mark-as-todo`),
  confirmReceipt: (id) => api.post(`/inventory/receipts/${id}/confirm`),
  validateReceipt: (id) => api.post(`/inventory/receipts/${id}/validate`),
  createDelivery: (data) => api.post('/inventory/deliveries', data),
  markDeliveryAsTodo: (id) => api.post(`/inventory/deliveries/${id}/mark-as-todo`),
  confirmDelivery: (id) => api.post(`/inventory/deliveries/${id}/confirm`),
  validateDelivery: (id) => api.post(`/inventory/deliveries/${id}/validate`),
  createTransfer: (data) => api.post('/inventory/transfers', data),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
};

export const reportService = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getStockLedger: (params) => api.get('/reports/ledger', { params }),
  getLowStockAlerts: () => api.get('/reports/low-stock'),
  getStockSnapshot: (params) => api.get('/reports/stock', { params }),
};

export default api;
