import axios from 'axios';

// En producción usa la variable de entorno VITE_API_URL (definida en .env.production)
// En desarrollo detecta automáticamente el host local con HTTPS
const getBaseURL = () => {
    // Si hay una variable de entorno definida en build-time, úsala (producción)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // Fallback para desarrollo local
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    const backendHost = isLocal ? 'localhost' : hostname;
    return `https://${backendHost}:5000/api`;
};

const api = axios.create({
    baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (userInfo && userInfo.token) {
        config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
});

export default api;
