// src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
                console.log('[AuthContext] Usuario cargado desde token:', decoded);
            } catch (error) {
                console.error('[AuthContext] Token inválido:', error);
                localStorage.removeItem('token');
                setUser(null);
            }
        }
    }, []); // ✅ Dependencia vacía para evitar ciclos

    const login = (token) => {
        localStorage.setItem('token', token);
        const decoded = jwtDecode(token);
        setUser(decoded);
        console.log('[AuthContext] Usuario autenticado:', decoded);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
