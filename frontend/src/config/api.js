// API Configuration with retry logic for Render free tier - BACKWARD COMPATIBLE
const API_BASE_URL = 'https://agg-backend.onrender.com/api';

// Enhanced fetch with retry logic for cold starts
const fetchWithRetry = async (url, options = {}, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (response.ok) return response;
      
      throw new Error(`HTTP ${response.status}`);
      
    } catch (error) {
      console.log(`API Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error('Service is starting up. Please try again in 30 seconds.');
      }
      
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// NEW: Enhanced API with retry logic (optional to use)
export const api = {
  login: (credentials) => 
    fetchWithRetry(`${API_BASE_URL}/login`, {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  getInventory: (token) => 
    fetchWithRetry(`${API_BASE_URL}/inventory`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),

  updateInventory: (token, data) =>
    fetchWithRetry(`${API_BASE_URL}/inventory/update`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    }),

  sellItem: (token, data) =>
    fetchWithRetry(`${API_BASE_URL}/sell`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(data)
    }),

  getTodaySales: (token) =>
    fetchWithRetry(`${API_BASE_URL}/stall-today-sales`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),

  getSalesAnalytics: (token) =>
    fetchWithRetry(`${API_BASE_URL}/sales-analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),

  getTodayStats: (token) =>
    fetchWithRetry(`${API_BASE_URL}/admin/today-stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }),

  getLowStock: (token) =>
    fetchWithRetry(`${API_BASE_URL}/admin/low-stock`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
};

// OLD: Keep original export for backward compatibility
export const API_BASE = API_BASE_URL;

// NEW: Health check function (optional)
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    const data = await response.json();
    return { healthy: true, data };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};