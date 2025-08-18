import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Estilos
import theme from './styles/theme';

// Páginas comunes
import LoginPage from './pages/LoginPage';

// Vistas SuperAdmin
import DashboardAdmin from './pages/admin/DashboardAdmin';
import UsersPage from './pages/admin/UsersPage';
import ReportsPage from './pages/admin/Reports';
import RegistroEmpresas from './pages/admin/RegistroEmpresas';
import VisualizacionGraficas from './pages/admin/VisualizacionGraficas';
import SettingsPageAdmin from './pages/admin/SettingsPage';

// Vistas Cliente
import DashboardCliente from './pages/cliente/DashboardCliente';
import MonitoreoTiempoReal from './pages/cliente/MonitoreoTiempoReal';
import AdministrarSuscripciones from './pages/cliente/AdministrarSuscripciones';
import LockersPage from './pages/cliente/LockersPage';
import RegistroEmpleado from './pages/cliente/RegistroEmpleado';
import SettingsPageCliente from './pages/cliente/SettingsPage';

// Protegidas
import ProtectedRoute from './components/Auth/ProtectedRoute';

const GOOGLE_CLIENT_ID = '840112297800-8d4m9jo63oip25fr4hnor0n77vdfaia8.apps.googleusercontent.com';

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Ruta pública */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rutas SuperAdmin */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute rolesAllowed={['superadmin', 1]}>
                  <DashboardAdmin />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute rolesAllowed={['superadmin', 1]}>
                  <UsersPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute rolesAllowed={['superadmin', 1]}>
                  <ReportsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/register-company" element={
                <ProtectedRoute rolesAllowed={['superadmin', 1]}>
                  <RegistroEmpresas />
                </ProtectedRoute>
              } />
              <Route path="/admin/charts" element={
                <ProtectedRoute rolesAllowed={['superadmin', 1]}>
                  <VisualizacionGraficas />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute rolesAllowed={['superadmin', 1]}>
                  <SettingsPageAdmin />
                </ProtectedRoute>
              } />

              {/* Rutas Cliente */}
              <Route path="/cliente/dashboard" element={
                <ProtectedRoute rolesAllowed={['cliente', 2]}>
                  <DashboardCliente />
                </ProtectedRoute>
              } />
              <Route path="/cliente/monitoreo" element={
                <ProtectedRoute rolesAllowed={['cliente', 2]}>
                  <MonitoreoTiempoReal />
                </ProtectedRoute>
              } />
              <Route path="/cliente/suscripciones" element={
                <ProtectedRoute rolesAllowed={['cliente', 2]}>
                  <AdministrarSuscripciones />
                </ProtectedRoute>
              } />
              <Route path="/cliente/lockers" element={
                <ProtectedRoute rolesAllowed={['cliente', 2]}>
                  <LockersPage />
                </ProtectedRoute>
              } />
              <Route path="/cliente/register-user" element={
                <ProtectedRoute rolesAllowed={['cliente', 2]}>
                  <RegistroEmpleado />
                </ProtectedRoute>
              } />
              <Route path="/cliente/settings" element={
                <ProtectedRoute rolesAllowed={['cliente', 2]}>
                  <SettingsPageCliente />
                </ProtectedRoute>
              } />

              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
