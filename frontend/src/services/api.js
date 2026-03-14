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
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
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
};

export const inventoryService = {
  createReceipt: (data) => api.post('/inventory/receipts', data),
  createDelivery: (data) => api.post('/inventory/deliveries', data),
  createTransfer: (data) => api.post('/inventory/transfers', data),
  createAdjustment: (data) => api.post('/inventory/adjustments', data),
};

export const reportService = {
  getDashboardStats: () => api.get('/reports/dashboard'),
  getStockLedger: () => api.get('/reports/ledger'),
  getLowStockAlerts: () => api.get('/reports/low-stock'),
};

export default api;
