// Use environment variable or fallback to production URL
const API_BASE = import.meta.env.VITE_API_URL || 'https://agg-backend.onrender.com/api';
export default API_BASE;
export { API_BASE };