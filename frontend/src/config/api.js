// API Configuration with retry logic for Render free tier
const API_BASE = 'https://agg-backend.onrender.com/api';

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
      console.log(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw new Error('Service is starting up. Please try again in 30 seconds.');
      }
      
      // Wait before retry
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Login with retry
export const loginWithRetry = (credentials) => 
  fetchWithRetry(`${API_BASE}/login`, {
    method: 'POST',
    body: JSON.stringify(credentials)
  });

export const API_BASE = API_BASE;