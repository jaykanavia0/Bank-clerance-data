import axios from 'axios';

// API URL configuration for single service deployment
const API_URL = import.meta.env.VITE_API_URL || '';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout for deployment
});

// Response Interceptor with minimal error exposure
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const safeError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.response?.data?.error || 'An unexpected error occurred',
    };

    // Log only sanitized error (avoid exposing stack traces or full payloads)
    if (import.meta.env.DEV) {
      console.error('API Error:', safeError); // Dev-only log
    }

    return Promise.reject(safeError);
  }
);

// Request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Defensive helper to validate query input (enhanced validation)
const isValidPosition = (position) => {
  const validPositions = ['all', 'gm_head', 'level1', 'level2', 'level3', 'tech_level1', 'tech_level2'];
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

    // Validate required fields
    const requiredFields = ['bank_id', 'issue_category', 'severity'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return Promise.reject({ 
        status: 400, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
    }

    return apiClient.post('/api/route_issue', formData);
  },

  // ============================================================================
  // SEBI API ENDPOINTS (New functionality)
  // ============================================================================

  // Get list of SEBI entities with optional filters
  getSebiEntities: (filters = {}) => {
    const params = new URLSearchParams();
    
    // Sanitize and validate filters
    if (filters.search && typeof filters.search === 'string') {
      params.append('search', filters.search.trim());
    }
    if (filters.state && typeof filters.state === 'string') {
      params.append('state', filters.state.trim());
    }
    if (filters.city && typeof filters.city === 'string') {
      params.append('city', filters.city.trim());
    }
    
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

    // Validate required fields for SEBI routing
    const requiredFields = ['sebi_id', 'issue_category', 'severity'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      return Promise.reject({ 
        status: 400, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      });
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

  // Connection test with retry logic
  testConnectionWithRetry: async (maxRetries = 3) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const result = await apiClient.get('/api/test');
        if (import.meta.env.DEV) {
          console.log(`✅ API connection successful on attempt ${i + 1}`);
        }
        return result;
      } catch (error) {
        lastError = error;
        if (import.meta.env.DEV) {
          console.warn(`❌ API connection failed on attempt ${i + 1}:`, error.message);
        }
        
        if (i < maxRetries - 1) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError;
  }
};

export default apiService;