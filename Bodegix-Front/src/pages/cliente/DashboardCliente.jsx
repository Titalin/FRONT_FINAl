import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Typography, Paper, Divider, Skeleton, Alert, Button, Chip,
  LinearProgress, Stack, IconButton, CircularProgress, alpha
} from '@mui/material';
import { People as PeopleIcon, Lock as LockersIcon, Assignment as AssignmentIcon, Storage as StorageIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import Sidebar from '../../components/Layout/Sidebar';
import { jwtDecode } from 'jwt-decode';
import api from '../../services/api';

const useCountUp = (value, duration = 600) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let raf;
    const start = performance.now();
    const from = display;
    const delta = value - from;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setDisplay(Math.round(from + delta * p));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return display;
};

function StatCard({ icon, label, value, gradient }) {
  const num = useCountUp(value);
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, minHeight: 170, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', position: 'relative', background: gradient, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,.18)', transition: 'transform .18s, box-shadow .18s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 18px 50px rgba(0,0,0,.22)' } }}>
      <Box sx={{ mb: 1, opacity: 0.95 }}>{icon}</Box>
      <Typography variant="h3" fontWeight={800} sx={{ lineHeight: 1 }}>{num}</Typography>
      <Typography variant="subtitle1" sx={{ opacity: 0.95 }}>{label}</Typography>
    </Paper>
  );
}

function OccupancyCard({ asignados, total, ocupacion, onRefresh }) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, minWidth: 320, color: '#fff', background: alpha('#ffffff', 0.08), border: `1px solid ${alpha('#ffffff', 0.18)}`, backdropFilter: 'blur(6px)', boxShadow: '0 10px 30px rgba(0,0,0,.18)' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" sx={{ mb: 1, opacity: 0.9 }}>Ocupación de lockers</Typography>
        <IconButton size="small" onClick={onRefresh} sx={{ color: '#fff' }} title="Refrescar"><RefreshIcon fontSize="small" /></IconButton>
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box position="relative" display="inline-flex">
          <CircularProgress variant="determinate" value={ocupacion} thickness={5} size={68} sx={{ color: '#fff' }} />
          <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="subtitle2" component="div" color="#0b1220" fontWeight={800}>{ocupacion}%</Typography>
          </Box>
        </Box>
        <Stack flex={1} spacing={1}>
          <LinearProgress variant="determinate" value={ocupacion} sx={{ height: 10, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.25)', '& .MuiLinearProgress-bar': { backgroundColor: '#fff' } }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="caption" sx={{ color: '#fff' }}>{asignados} / {total} usados</Typography>
            <Chip size="small" label={ocupacion < 50 ? 'Baja' : ocupacion < 80 ? 'Media' : 'Alta'} sx={{ bgcolor: '#fff', color: ocupacion < 50 ? '#1976d2' : ocupacion < 80 ? '#ef6c00' : '#d32f2f', fontWeight: 700, height: 22 }} />
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

export default function DashboardCliente() {
  const [lockers, setLockers] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [token, setToken] = useState('');
  const [empresaId, setEmpresaId] = useState(null);

  const arr = (v) => (Array.isArray(v) ? v : v?.data ?? []);

  useEffect(() => {
    try {
      const t = localStorage.getItem('token');
      if (!t) {
        setLoading(false);
        setError('No hay sesión activa.');
        return;
      }
      const decoded = jwtDecode(t);
      const empId = Number(decoded?.empresa_id);
      if (!empId) {
        setLoading(false);
        setError('El token no contiene empresa_id.');
        return;
      }
      setToken(t);
      setEmpresaId(empId);
    } catch {
      setLoading(false);
      setError('Token inválido. Inicia sesión nuevamente.');
    }
  }, []);

  const loadData = async () => {
    if (!token || !empresaId) return;
    setLoading(true);
    setError('');
    try {
      const lockersResp = await api.get(`/lockers/empresa/${empresaId}`);
      setLockers(arr(lockersResp.data));

      const empleadosResp = await api.get('/usuarios', { params: { rol_id: 3, empresa_id: empresaId } });
      const emps = arr(empleadosResp.data).filter(
        (e) => Number(e?.empresa_id) === Number(empresaId) && String(e?.rol_id) === '3'
      );
      setEmpleados(emps);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err?.response?.data?.message || err.message || 'Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && empresaId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, empresaId]);

  const { totalLockers, asignados, disponibles, totalEmpleados, ocupacion } = useMemo(() => {
    const total = lockers.length;
    const asig = lockers.filter((l) => String(l?.estado) === 'activo' && l?.usuario_id != null).length;
    const disp = Math.max(0, total - asig);
    const occ = total > 0 ? Math.round((asig / total) * 100) : 0;
    return { totalLockers: total, asignados: asig, disponibles: disp, totalEmpleados: empleados.length, ocupacion: occ };
  }, [lockers, empleados]);

  const statCards = [
    { label: 'Total de Lockers', value: totalLockers, icon: <LockersIcon fontSize="large" />, gradient: 'linear-gradient(135deg, #1a275e, #203679)' },
    { label: 'Asignados', value: asignados, icon: <AssignmentIcon fontSize="large" />, gradient: 'linear-gradient(135deg, #c75a0e, #e9772f)' },
    { label: 'Disponibles', value: disponibles, icon: <StorageIcon fontSize="large" />, gradient: 'linear-gradient(135deg, #1a275e, #203679)' },
    { label: 'Total de Empleados', value: totalEmpleados, icon: <PeopleIcon fontSize="large" />, gradient: 'linear-gradient(135deg, #c75a0e, #e9772f)' },
  ];

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: 'radial-gradient(80rem 40rem at 10% -30%, #18223f, #0b1220)' }}>
      <Sidebar />
      <Box flexGrow={1} sx={{ minHeight: '100vh' }}>
        <Box sx={{ px: 3, py: 4, background: 'linear-gradient(135deg, rgba(25,118,210,1) 40%, rgba(0,198,251,1) 100%)', borderRadius: '0 0 28px 28px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(60rem 18rem at -20% -10%, rgba(255,255,255,.25), transparent 40%)', pointerEvents: 'none' }} />
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={800} letterSpacing={0.5}>Bienvenido al panel de cliente</Typography>
              <Typography variant="body1" sx={{ opacity: 0.95, mt: 0.5 }}>Visualiza el estado de lockers y personal asignado en tu empresa.</Typography>
              <Button onClick={loadData} variant="outlined" sx={{ mt: 2, color: '#fff', borderColor: alpha('#fff', 0.7), '&:hover': { borderColor: '#fff', background: alpha('#fff', 0.1) } }} startIcon={<RefreshIcon />}>Refrescar datos</Button>
            </Box>

            <OccupancyCard asignados={asignados} total={totalLockers} ocupacion={ocupacion} onRefresh={loadData} />
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
            {error} <Button color="inherit" size="small" onClick={loadData} sx={{ ml: 1 }}>Reintentar</Button>
          </Alert>
        )}

        {loading ? (
          <Grid container spacing={3} sx={{ px: 3, mt: 2 }}>
            {[...Array(4)].map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Paper sx={{ p: 3, borderRadius: 4, bgcolor: alpha('#fff', 0.04) }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Skeleton variant="text" height={42} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="60%" />
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Grid container spacing={3} sx={{ px: 3, mt: 2 }}>
            {statCards.map((s, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <StatCard icon={s.icon} label={s.label} value={s.value} gradient={s.gradient} />
              </Grid>
            ))}
          </Grid>
        )}

        {!loading && !error && (!totalLockers || !totalEmpleados) && (
          <Box px={3} mt={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: alpha('#fff', 0.06), color: '#fff', border: `1px solid ${alpha('#fff', 0.12)}` }}>
              <Typography variant="subtitle1" gutterBottom fontWeight={700}>¿Recién empiezas?</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {totalLockers === 0
                  ? 'Aún no tienes lockers creados. Activa una suscripción o crea lockers desde la sección “Lockers”.'
                  : 'Aún no hay empleados registrados con rol Trabajador (rol_id = 3). Agrega empleados desde la sección “Usuarios”.'}
              </Typography>
            </Paper>
          </Box>
        )}

        <Divider sx={{ my: 6, borderColor: alpha('#fff', 0.1) }} />
      </Box>
    </Box>
  );
}
