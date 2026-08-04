import axios from 'axios';

const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle token expiration & refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Prevent infinite loop if refresh endpoint itself returns 401
    if (error.response && error.response.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/api/auth/refresh')) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          if (res.status === 200) {
            localStorage.setItem('accessToken', res.data.access_token);
            localStorage.setItem('refreshToken', res.data.refresh_token);
            
            // Update the auth headers
            api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
            originalRequest.headers['Authorization'] = `Bearer ${res.data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          console.error('Refresh token expired or invalid. Logging out.');
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
