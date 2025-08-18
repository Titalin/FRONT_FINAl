// src/pages/admin/DashboardAdmin.jsx
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Alert,
  Skeleton,
  Stack
} from '@mui/material';
import {
  People as PeopleIcon,
  Lock as LockersIcon,
  Subscriptions as SubscriptionsIcon
} from '@mui/icons-material';
import Sidebar from '../components/Layout/Sidebar';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const DashboardAdmin = () => {
  const [stats, setStats] = useState({
    usuarios: 0,
    lockers: 0,
    suscripciones: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No se encontró token de sesión. Inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      try {
        jwtDecode(token); // valida token
      } catch (err) {
        setError('Token inválido. Inicia sesión nuevamente.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [uRes, lRes, sRes] = await Promise.all([
          api.get('/usuarios/admin'),
          api.get('/lockers'),
          api.get('/suscripciones'),
        ]);

        const usuariosArr = Array.isArray(uRes.data) ? uRes.data : (uRes.data?.data ?? []);
        const lockersArr = Array.isArray(lRes.data) ? lRes.data : (lRes.data?.data ?? []);
        const susArr = Array.isArray(sRes.data) ? sRes.data : (sRes.data?.data ?? []);

        const activas = susArr.filter((s) => String(s?.estado || '').toLowerCase() === 'activa').length;

        setStats({
          usuarios: usuariosArr.length,
          lockers: lockersArr.length,
          suscripciones: activas,
        });
        setError('');
      } catch (err) {
        console.error('[DashboardAdmin] Error al cargar estadísticas:', err);
        setError('Error al cargar estadísticas. Intenta de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Usuarios Registrados',
      value: stats.usuarios,
      icon: <PeopleIcon fontSize="large" />,
      color: 'linear-gradient(135deg, rgb(26, 39, 94), rgb(33, 58, 130))',
      ring: 'linear-gradient(135deg, #6fb1fc, #4361ee)',
    },
    {
      title: 'Total de Lockers',
      value: stats.lockers,
      icon: <LockersIcon fontSize="large" />,
      color: 'linear-gradient(135deg, rgb(199, 90, 14), rgb(233, 119, 47))',
      ring: 'linear-gradient(135deg, #ffb86b, #ff885b)',
    },
    {
      title: 'Suscripciones Activas',
      value: stats.suscripciones,
      icon: <SubscriptionsIcon fontSize="large" />,
      color: 'linear-gradient(135deg, rgb(26, 39, 94), rgb(33, 58, 130))',
      ring: 'linear-gradient(135deg, #6fb1fc, #4361ee)',
    },
  ];

  return (
    <Box
      display="flex"
      minHeight="100vh"
      sx={{ background: 'linear-gradient(120deg, #1a2540 70%, #232E4F 100%)' }}
    >
      <Sidebar />
      <Box flexGrow={1} p={0} sx={{ minHeight: '100vh' }}>
        {/* Hero */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1976d2 60%, #00c6fb 100%)',
            p: 4,
            borderRadius: '0 0 32px 32px',
            color: 'white',
            mb: 4,
          }}
        >
          <Typography
            variant="h4"
            fontWeight="bold"
            letterSpacing={1}
            sx={{ textShadow: '0 4px 24px rgba(0,0,0,0.18)' }}
          >
            Panel de administración
          </Typography>
          <Typography variant="body1" mt={1}>
            Gestiona usuarios, lockers y suscripciones desde un solo lugar.
          </Typography>
        </Box>

        {!!error && (
          <Box px={3} mb={2}>
            <Alert severity="error" variant="filled">
              {error}
            </Alert>
          </Box>
        )}

        {/* Stats */}
        <Grid container spacing={4} mt={1} px={3}>
          {loading
            ? [...Array(3)].map((_, i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    <Skeleton variant="circular" width={56} height={56} />
                    <Skeleton variant="text" height={44} sx={{ mt: 1 }} />
                    <Skeleton variant="text" width="60%" />
                  </Paper>
                </Grid>
              ))
            : statCards.map((stat, i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                  <Paper
                    elevation={10}
                    sx={{
                      p: 3,
                      borderRadius: 4,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 190,
                      background: stat.color,
                      color: '#fff',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 10px 36px rgba(0,0,0,0.25)',
                      transition: 'transform .25s ease, box-shadow .25s ease',
                      '&:hover': {
                        transform: 'translateY(-4px) scale(1.02)',
                        boxShadow: '0 18px 48px rgba(0,0,0,0.35)',
                      },
                    }}
                  >
                    {/* halo */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -30,
                        right: -30,
                        width: 130,
                        height: 130,
                        borderRadius: '50%',
                        background: stat.ring,
                        opacity: 0.25,
                        filter: 'blur(8px)',
                      }}
                    />
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        mb: 1.5,
                        background: 'rgba(255,255,255,0.15)',
                        border: '2px solid rgba(255,255,255,0.35)',
                        boxShadow: 'inset 0 0 12px rgba(255,255,255,0.25)',
                      }}
                    >
                      {stat.icon}
                    </Box>

                    <Typography variant="h3" fontWeight="800" sx={{ lineHeight: 1, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.95 }}>
                      {stat.title}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ position: 'absolute', bottom: 10, opacity: 0.6 }}
                    >
                      <Box sx={{ width: 40, height: 4, bgcolor: 'rgba(255,255,255,0.5)', borderRadius: 2 }} />
                      <Box sx={{ width: 20, height: 4, bgcolor: 'rgba(255,255,255,0.35)', borderRadius: 2 }} />
                      <Box sx={{ width: 12, height: 4, bgcolor: 'rgba(255,255,255,0.25)', borderRadius: 2 }} />
                    </Stack>
                  </Paper>
                </Grid>
              ))}
        </Grid>

        <Divider sx={{ my: 6, borderColor: 'rgba(255,255,255,0.10)' }} />
      </Box>
    </Box>
  );
};

export default DashboardAdmin;
