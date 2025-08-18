// src/services/api.js
import axios from 'axios';

const PROD_HOST = 'https://backend-bodegix.onrender.com';

// Detecta si estamos en prod (Vercel) vs dev (localhost/extension)
const isBrowser = typeof window !== 'undefined';
const isProd =
  isBrowser &&
  !/^(http:\/\/(localhost|127\.0\.0\.1)|chrome-extension:\/\/)/i.test(
    window.location.origin
  );

// 1) Lee env; si no hay:
//    - en prod: usa tu backend público
//    - en dev: localhost
const RAW =
  process.env.REACT_APP_API_URL ||
  (isProd ? PROD_HOST : 'http://localhost:5000');

// 2) Normaliza para terminar en /api
const baseURL = RAW.endsWith('/api') ? RAW : `${RAW.replace(/\/+$/, '')}/api`;

// 3) Seguridad: evita prod con localhost
if (isProd && /localhost/i.test(baseURL)) {
  throw new Error(`[API] baseURL inválido en producción: ${baseURL}`);
}

const api = axios.create({ baseURL });

// Adjunta token automaticamente
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (_) {}
  return config;
});

export default api;
