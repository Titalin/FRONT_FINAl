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

// Crea cliente
const api = axios.create({
  baseURL,
  // timeout: 15000, // opcional
});

// Adjunta token automáticamente
api.interceptors.request.use((config) => {
  try {
    if (isBrowser) {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Manejo centralizado de respuestas/errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const msg =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      'Error de red';

    if (status === 401) {
      // Sesión expirada o token inválido
      if (isBrowser) {
        try { localStorage.removeItem('token'); } catch (_) {}
        // Evita múltiples alerts encadenados
        if (!window.__BODEGIX__SEEN_401) {
          window.__BODEGIX__SEEN_401 = true;
          alert('Tu sesión expiró. Ingresa nuevamente.');
        }
        window.location.href = '/login';
      }
    }

    if (status === 402) {
      // Suscripción requerida/inactiva
      if (isBrowser) {
        if (!window.__BODEGIX__SEEN_402) {
          window.__BODEGIX__SEEN_402 = true;
          alert(msg || 'Tu suscripción no está activa. Actívala para administrar lockers.');
        }
        window.location.href = '/cliente/suscripciones';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
