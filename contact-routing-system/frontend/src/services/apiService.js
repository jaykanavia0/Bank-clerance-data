import axios from 'axios';

// Secure base URL from environment
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Prevent hanging requests
});

// Response Interceptor with minimal error exposure
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const safeError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || 'An unexpected error occurred',
    };

    // Log only sanitized error (avoid exposing stack traces or full payloads)
    if (import.meta.env.DEV) {
      console.error('API Error:', safeError); // Dev-only log
    }

    return Promise.reject(safeError);
  }
);

// Defensive helper to validate query input (basic sanitization)
const isValidPosition = (position) => {
  const validPositions = ['all', 'manager', 'support', 'teller']; // Example list
  return validPositions.includes(position);
};

const apiService = {
  // ============================================================================
  // BANK API ENDPOINTS (Original functionality)
  // ============================================================================
  
  // Get list of banks
  getBanks: () => {
    return apiClient.get('/api/banks');
  },

  // Get contacts with input validation
  getContacts: (position = 'all') => {
    const safePosition = isValidPosition(position) ? position : 'all';
    return apiClient.get(`/api/contacts?position=${encodeURIComponent(safePosition)}`);
  },

  // Get list of issue categories
  getCategories: () => {
    return apiClient.get('/api/categories');
  },

  // Get list of severity levels
  getSeverities: () => {
    return apiClient.get('/api/severities');
  },

  // Route an issue to get contact information
  routeIssue: (formData) => {
    if (typeof formData !== 'object') {
      return Promise.reject({ status: 400, message: 'Invalid request payload' });
    }

    return apiClient.post('/api/route_issue', formData);
  },

  // ============================================================================
  // SEBI API ENDPOINTS (New functionality)
  // ============================================================================

  // Get list of SEBI entities with optional filters
  getSebiEntities: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.state) params.append('state', filters.state);
    if (filters.city) params.append('city', filters.city);
    
    const queryString = params.toString();
    return apiClient.get(`/api/sebi/entities${queryString ? '?' + queryString : ''}`);
  },

  // Get SEBI issue categories
  getSebiCategories: () => {
    return apiClient.get('/api/sebi/categories');
  },

  // Get list of states from SEBI data
  getSebiStates: () => {
    return apiClient.get('/api/sebi/states');
  },

  // Route SEBI issue
  routeSebiIssue: (formData) => {
    if (typeof formData !== 'object') {
      return Promise.reject({ status: 400, message: 'Invalid request payload' });
    }
    return apiClient.post('/api/sebi/route', formData);
  },

  // ============================================================================
  // GENERAL API ENDPOINTS
  // ============================================================================

  // Test API connectivity
  testConnection: () => {
    return apiClient.get('/api/test');
  },

  // Health check
  healthCheck: () => {
    return apiClient.get('/health');
  },
};

export default apiService;