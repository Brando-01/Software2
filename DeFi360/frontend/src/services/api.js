import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============ AUTH SERVICES ============
const persistSession = (data) => {
  if (!data.token) return data;
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('userData', JSON.stringify(data.user));
  localStorage.setItem('walletConnected', 'true');
  localStorage.setItem('walletAddress', data.user.walletAddress || '');
  const balance = data.user.wallet?.availableBalance ?? data.user.wallet?.totalBalance ?? 0;
  localStorage.setItem('walletBalance', balance.toString());
  return data;
};

export const authService = {
  connectWallet: async (walletAddress) => {
    const response = await api.post('/auth/connect-wallet', { walletAddress });
    return persistSession(response.data);
  },

  register: async (credentials) => {
    const response = await api.post('/auth/register', credentials);
    return persistSession(response.data);
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return persistSession(response.data);
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