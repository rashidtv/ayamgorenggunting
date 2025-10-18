// Dynamic API configuration
const getApiBase = () => {
  // In production, this will be your Cyclic backend URL
  if (import.meta.env.PROD) {
    return 'https://your-cyclic-backend.cyclic.app/api'; // We'll update this after deployment
  }
  // In development, use local backend
  return 'http://localhost:10000/api';
};

export const API_BASE = getApiBase();