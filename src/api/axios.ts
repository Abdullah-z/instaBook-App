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
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
