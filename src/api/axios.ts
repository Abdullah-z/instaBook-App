import axios from 'axios';
import { getToken } from '../auth/tokenManager';

const API = axios.create({
  baseURL: 'https://instabook-server-production.up.railway.app/api',
});

API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = token;
    }
    console.log(
      `🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`,
      config.params || ''
    );
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]', error);
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      `❌ [API Response Error] ${error.response?.status || 'No Status'} ${error.config?.url}`,
      error.message
    );
    return Promise.reject(error);
  }
);

export default API;
