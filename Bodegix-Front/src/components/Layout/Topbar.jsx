import React, { useMemo, useState } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  useScrollTrigger,
  alpha,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import RefreshIcon from '@mui/icons-material/Refresh';
import { jwtDecode } from 'jwt-decode';

/**
 * Topbar compacto y moderno, con blur y sombra al hacer scroll.
 *
 * Props:
 *  - title?: string
 *  - rightContent?: ReactNode  (se renderiza antes de los íconos)
 *  - onRefresh?: () => void    (si no se pasa, hace location.reload())
 */
export default function Topbar({ title = '', rightContent = null, onRefresh }) {
  const [anchorUser, setAnchorUser] = useState(null);
  const [anchorNotif, setAnchorNotif] = useState(null);

  // Sombra/elevación sólo cuando hay scroll
  const scrolled = useScrollTrigger({ threshold: 4 });

  // Decodifica token para mostrar datos del usuario
  const userMeta = useMemo(() => {
    try {
      const t = localStorage.getItem('token');
      if (!t) return null;
      const d = jwtDecode(t);
      return {
        nombre: d?.nombre || d?.name || 'Usuario',
        empresa: d?.empresa_nombre || d?.empresa || 'Empresa',
        rol: d?.rol_nombre || d?.rol || 'Cliente',
      };
    } catch {
      return null;
    }
  }, []);

  // DEMO de notificaciones (reemplaza por datos reales si los tienes)
  const notifications = [
    { id: 1, title: 'Locker 002 fuera de rango', time: 'hace 2 min' },
    { id: 2, title: 'Nueva lectura recibida', time: 'hace 10 min' },
  ];
  const notifCount = notifications.length;

  const openUser = (e) => setAnchorUser(e.currentTarget);
  const closeUser = () => setAnchorUser(null);
  const openNotif = (e) => setAnchorNotif(e.currentTarget);
  const closeNotif = () => setAnchorNotif(null);

  const handleRefresh = () => {
    if (typeof onRefresh === 'function') onRefresh();
    else window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('token');
    window.location.replace('/login');
  };

  return (
    <AppBar
      position="sticky"
      elevation={scrolled ? 8 : 0}
      sx={(theme) => ({
        backdropFilter: 'saturate(140%) blur(8px)',
        backgroundColor: alpha(theme.palette.background.paper, 0.65),
        color: theme.palette.getContrastText(theme.palette.background.paper),
        transition: 'box-shadow 0.2s ease, background-color 0.2s ease',
        borderBottom: `1px solid ${alpha('#fff', 0.08)}`,
      })}
    >
      <Toolbar
        sx={{
          minHeight: 60,
          px: { xs: 2, md: 3 },
          gap: 1,
        }}
      >
        {/* Título */}
        <Typography
          variant="h6"
          noWrap
          sx={{ fontWeight: 700, letterSpacing: 0.2, mr: 'auto' }}
        >
          {title || 'Dashboard'}
        </Typography>

        {/* Área derecha extra (opcional) */}
        {rightContent && (
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 0.5 }}>
            {rightContent}
          </Box>
        )}

        {/* Refrescar */}
        <Tooltip title="Refrescar">
          <IconButton color="inherit" onClick={handleRefresh}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>

        {/* Notificaciones */}
        <Tooltip title="Notificaciones">
          <IconButton
            color="inherit"
            onClick={openNotif}
            sx={{ ml: 0.5 }}
            aria-label="Abrir notificaciones"
          >
            <Badge badgeContent={notifCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorNotif}
          open={Boolean(anchorNotif)}
          onClose={closeNotif}
          PaperProps={{
            elevation: 8,
            sx: { mt: 1.2, minWidth: 320, borderRadius: 2 },
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Notificaciones
            </Typography>
          </Box>
          <Divider />
          {notifications.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No tienes notificaciones.
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ py: 0 }}>
              {notifications.map((n) => (
                <ListItem key={n.id} sx={{ py: 1.1 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {n.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {n.time}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Menu>

        {/* Usuario */}
        <Tooltip title="Cuenta">
          <IconButton
            onClick={openUser}
            sx={{
              ml: 0.5,
              p: 0.5,
              border: (theme) => `1px solid ${alpha(theme.palette.common.white, 0.25)}`,
              borderRadius: '50%',
              bgcolor: (theme) => alpha(theme.palette.common.white, 0.08),
              '&:hover': {
                bgcolor: (theme) => alpha(theme.palette.common.white, 0.16),
              },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                bgcolor: 'transparent',
                color: 'inherit',
              }}
            >
              <AccountCircleIcon />
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorUser}
          open={Boolean(anchorUser)}
          onClose={closeUser}
          PaperProps={{
            elevation: 8,
            sx: { mt: 1.2, minWidth: 240, borderRadius: 2 },
          }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {/* Header del menú */}
          <Box sx={{ px: 2, pt: 2, pb: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {userMeta?.nombre || 'Usuario'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {userMeta?.rol || 'Cliente'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
              <BusinessIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {userMeta?.empresa || 'Empresa'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={() => { closeUser(); window.location.href = '/perfil'; }}>
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            Perfil
          </MenuItem>

          <MenuItem onClick={() => { closeUser(); window.location.href = '/configuracion'; }}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            Configuración
          </MenuItem>

          <Divider sx={{ my: 1 }} />

          <MenuItem onClick={logout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
