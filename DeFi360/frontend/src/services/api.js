import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    console.log('Interceptor - Token encontrado:', token ? 'Sí' : 'No');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Interceptor - Header Authorization agregado');
    } else {
      console.log('Interceptor - No hay token');
    }
    return config;
  },
  (error) => {
    console.error('Interceptor error:', error);
    return Promise.reject(error);
  }
);

// ============ AUTH SERVICES ============
export const authService = {
  connectWallet: async (walletAddress) => {
  const response = await api.post('/auth/connect-wallet', { walletAddress });
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('userData', JSON.stringify(response.data.user));
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', response.data.user.walletAddress);
    // ✅ IMPORTANTE: El balance puede venir como string o número
    const balance = response.data.user.wallet?.availableBalance || response.data.user.wallet?.totalBalance || 0;
    localStorage.setItem('walletBalance', balance.toString());
  }
  return response.data;
},
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    if (response.data.wallet) {
      localStorage.setItem('walletBalance', response.data.wallet.availableBalance);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletBalance');
  },
  
  getCurrentUser: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
};

// ============ MARKETPLACE SERVICES ============
export const marketplaceService = {
  getOffers: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/marketplace/offers${params ? `?${params}` : ''}`);
    return response.data;
  },
  
  createOffer: async (offerData) => {
    const response = await api.post('/marketplace/offers', offerData);
    return response.data;
  },
  
  cancelOffer: async (offerId) => {
    const response = await api.delete(`/marketplace/offers/${offerId}`);
    return response.data;
  }
};

// ============ LOAN SERVICES ============
export const loanService = {
  calculateLTV: async (data) => {
    const response = await api.post('/loans/calculate-ltv', data);
    return response.data;
  },
  
  requestLoan: async (data) => {
    const response = await api.post('/loans/request', data);
    return response.data;
  },
  
  getUserLoans: async () => {
    const response = await api.get('/loans/my-loans');
    return response.data;
  },
  
  matchLoan: async (offerId) => {
    const response = await api.post(`/loans/match/${offerId}`);
    return response.data;
  },
  
  payLoan: async (loanId, amount) => {
    const response = await api.post(`/loans/${loanId}/pay`, { amount });
    return response.data;
  }
};

// ============ SUPPORT SERVICES ============
export const supportService = {
  createTicket: async (data) => {
    const response = await api.post('/support/tickets', data);
    return response.data;
  },
  
  getUserTickets: async () => {
    const response = await api.get('/support/tickets');
    return response.data;
  },
  
  getTicketById: async (id) => {
    const response = await api.get(`/support/tickets/${id}`);
    return response.data;
  }
};

export default api;