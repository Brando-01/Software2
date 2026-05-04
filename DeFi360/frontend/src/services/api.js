import axios from 'axios';

// Configuración base de la API (cuando tengas backend)
const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicios de autenticación (simulados por ahora)
export const authService = {
  // Simular conexión de wallet
  connectWallet: async (walletAddress) => {
    // Simulación - reemplazar con llamada real al backend después
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            id: 1,
            walletAddress: walletAddress,
            balance: 5000,
          },
          token: 'mock-jwt-token',
        });
      }, 500);
    });
  },
  
  disconnect: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
  },
};

// Servicios de Marketplace
export const marketplaceService = {
  getOffers: async (filters = {}) => {
    // Simulación - conectar con backend después
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [
            { id: 1, type: 'lend', amount: 5000, apy: 5.2, duration: 30 },
            { id: 2, type: 'borrow', amount: 2000, apy: 4.8, duration: 60 },
          ],
        });
      }, 300);
    });
  },
  
  createLendOffer: async (offerData) => {
    // Simulación
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Oferta creada exitosamente' });
      }, 500);
    });
  },
  
  createBorrowRequest: async (requestData) => {
    // Simulación
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Solicitud enviada' });
      }, 500);
    });
  },
};

// Servicios de Préstamos
export const loanService = {
  calculateLTV: (loanAmount, collateralAmount, collateralPrice = 3000) => {
    const collateralValue = collateralAmount * collateralPrice;
    return (loanAmount / collateralValue) * 100;
  },
  
  getActiveLoans: async () => {
    // Simulación
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: [
            { id: 1, amount: 1000, ltv: 65, status: 'active' },
            { id: 2, amount: 500, ltv: 45, status: 'active' },
          ],
        });
      }, 300);
    });
  },
};

// Servicios de Soporte
export const supportService = {
  createTicket: async (ticketData) => {
    // Simulación
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          ticketNumber: 'TKT-' + Math.floor(Math.random() * 10000),
        });
      }, 500);
    });
  },
};

// Servicios Educativos
export const educationService = {
  getGlossary: () => {
    return {
      terms: [
        { term: 'DeFi', definition: 'Finanzas Descentralizadas' },
        { term: 'LTV', definition: 'Loan-to-Value, ratio préstamo/colateral' },
        { term: 'APY', definition: 'Rendimiento porcentual anual' },
        { term: 'Liquidación', definition: 'Venta forzada de colateral' },
      ],
    };
  },
};

export default api;