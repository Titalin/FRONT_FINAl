// src/components/Layout/Sidebar.jsx
import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  InsertChart as ReportIcon,
  PersonAdd as RegisterIcon,
  Visibility as MonitorIcon,
  Lock as LockersIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import Logo from '../common/Logo';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api'; // ⬅️ usa el cliente axios con baseURL correcto

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = React.useContext(AuthContext);

  const handleLogout = async () => {
    try {
      // El interceptor ya adjunta el token, no pongas headers manuales
      await api.post('usuarios/logout');
    } catch (error) {
      console.error('Error al cerrar sesión en backend:', error);
    } finally {
      localStorage.removeItem('token');
      logout();
      navigate('/login');
    }
  };

  const isSuperAdmin = user?.rol_id === 1;
  const isAdminEmpresa = user?.rol_id === 2;

  const superAdminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin/dashboard' },
    { text: 'Usuarios', icon: <PeopleIcon />, path: '/admin/users' },
    { text: 'Reportes', icon: <ReportIcon />, path: '/admin/reports' },
    { text: 'Registrar Empresa', icon: <RegisterIcon />, path: '/admin/register-company' },
    { text: 'Empresa Status', icon: <BusinessIcon />, path: '/admin/charts' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/admin/settings' }
  ];

  const adminEmpresaMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/cliente/dashboard' },
    { text: 'Monitoreo', icon: <MonitorIcon />, path: '/cliente/monitoreo' },
    { text: 'Lockers', icon: <LockersIcon />, path: '/cliente/lockers' },
    { text: 'Suscripciones', icon: <ReportIcon />, path: '/cliente/suscripciones' },
    { text: 'Registrar Empleado', icon: <PersonIcon />, path: '/cliente/register-user' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/cliente/settings' }
  ];

  const clienteMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/cliente/dashboard' },
    { text: 'Monitoreo Tiempo Real', icon: <MonitorIcon />, path: '/cliente/monitoreo' },
  ];

  let menuItems = clienteMenuItems;
  if (isSuperAdmin) menuItems = superAdminMenuItems;
  else if (isAdminEmpresa) menuItems = adminEmpresaMenuItems;

  const drawerBgGradient = isSuperAdmin
    ? 'linear-gradient(180deg, #1a2540 0%, #0f172a 100%)'
    : isAdminEmpresa
      ? 'linear-gradient(180deg, #263238 0%, #1a1f24 100%)'
      : 'linear-gradient(180deg, #37474f 0%, #222 100%)';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          background: drawerBgGradient,
          color: '#fff',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Logo />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.3,
                backgroundColor: isActive ? 'rgba(79,195,247,0.15)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(79,195,247,0.25)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive ? '#4fc3f7' : '#b0bec5',
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.95rem',
                  color: isActive ? '#fff' : '#cfd8dc',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <Box sx={{ p: 1 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            mx: 1,
            backgroundColor: 'rgba(244,67,54,0.15)',
            '&:hover': { backgroundColor: 'rgba(244,67,54,0.3)' },
          }}
        >
          <ListItemIcon sx={{ color: '#ef5350', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar Sesión"
            primaryTypographyProps={{
              fontWeight: 700,
              fontSize: '0.95rem',
              color: '#ef9a9a',
            }}
          />
        </ListItemButton>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
