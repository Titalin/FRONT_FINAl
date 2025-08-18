// src/components/Auth/ProtectedRoute.jsx

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ rolesAllowed, children }) => {
    const { user } = useContext(AuthContext);

    if (!user) {
        console.warn('[ProtectedRoute] Usuario no autenticado, redirigiendo a /login');
        return <Navigate to="/login" replace />;
    }

    if (
        rolesAllowed &&
        !(rolesAllowed.includes(user.rol) || rolesAllowed.includes(user.rol_id))
    ) {
        console.warn('[ProtectedRoute] Rol no autorizado:', user.rol || user.rol_id);
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
