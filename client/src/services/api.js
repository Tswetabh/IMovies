import axios from 'axios';

export const TOKEN_KEY = 'imovies.token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function apiMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.code === 'ERR_NETWORK') {
    return 'Cannot reach the IMovies API. Is the server running on port 5000?';
  }
  return error.response?.data?.message || fallback;
}

export default api;
