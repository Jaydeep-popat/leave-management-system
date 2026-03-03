import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true, // For sending cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await api.post('/users/refresh-token');
        return api(originalRequest);
      } catch (err) {
        // Refresh token failed, meaning the user is logged out or session expired
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
