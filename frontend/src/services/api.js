import axios from 'axios';

// Detecta automáticamente el host correcto:
// - Si accedes desde localhost/127.0.0.1 → usa localhost
// - Si accedes desde la red (IP o dominio) → usa el hostname del navegador
const getBaseURL = () => {
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
