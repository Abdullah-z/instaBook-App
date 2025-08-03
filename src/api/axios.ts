import axios from 'axios';
import { getToken } from '../auth/tokenManager';

const API = axios.create({
  baseURL: 'http://192.168.5.47:8080/api',
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
