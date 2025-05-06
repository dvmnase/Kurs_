import axios from 'axios';
import { authService } from './authService';

const API_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        console.log('API Request:', {
            url: config.url,
            method: config.method,
            token: token ? 'present' : 'missing'
        });
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            url: response.config.url,
            status: response.status
        });
        return response;
    },
    (error) => {
        console.error('Response interceptor error:', {
            url: error.config?.url,
            status: error.response?.status,
            message: error.message
        });
       
        return Promise.reject(error);
    }
);

export default api; 