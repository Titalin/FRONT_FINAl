import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Stack, ToggleButton, ToggleButtonGroup,
  IconButton, Tooltip, Switch, Divider, LinearProgress, alpha, Badge, Button
} from '@mui/material';
import Sidebar from '../../components/Layout/Sidebar';

import SensorsIcon from '@mui/icons-material/Sensors';
import ShieldIcon from '@mui/icons-material/Shield';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ScaleIcon from '@mui/icons-material/Scale';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import api from '../../services/api';

const minutesSince = (iso) => {
  if (!iso) return Infinity;
  const t = new Date(iso).getTime();
  return (Date.now() - t) / 60000;
};
const estadoDe = (iso) => {
  const mins = minutesSince(iso);
  if (mins === Infinity) return 'SIN_DATOS';
  if (mins > 3) return 'DESACTUALIZADO';
  return 'OK';
};
const colorEstado = (s) => (s === 'OK' ? 'success' : s === 'DESACTUALIZADO' ? 'warning' : 'default');
const bordeEstado = (s) => (s === 'OK' ? '#22c55e' : s === 'DESACTUALIZADO' ? '#f59e0b' : '#94a3b8');
const friendlyLocker = (lockerId) => (lockerId || '').replace(/^LOCKER_/i, '') || lockerId || 'N/A';
const toMongoId = (identificador) => `LOCKER_${String(identificador).padStart(3, '0')}`;

export default function MonitoreoTiempoReal() {
  const [lecturas, setLecturas] = useState([]);       // Mongo
  const [activos, setActivos] = useState(new Set());  // MySQL
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const arr = (v) => (Array.isArray(v) ? v : v?.data ?? []);

  const fetchActivos = async () => {
    try {
      const { data } = await api.get('/lockers');
      const activosSet = new Set(
        arr(data).filter((l) => l.estado === 'activo').map((l) => toMongoId(l.identificador))
      );
      setActivos(activosSet);
    } catch {
      setActivos(new Set());
    }
  };

  const fetchLecturas = async () => {
    try {
      const { data } = await api.get('/temperaturas/latest-all'); // mismo host API
      setLecturas(arr(data));
      setLastRefreshed(new Date());
    } catch {
      setLecturas([]);
    } finally {
      setCargando(false);
    }
  };

  const refreshAll = async () => {
    setCargando(true);
    await Promise.all([fetchActivos(), fetchLecturas()]);
    setCargando(false);
  };

  useEffect(() => {
    refreshAll();
    let id;
    if (autoRefresh) id = setInterval(refreshAll, 5000);
    return () => id && clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const lecturasSoloActivos = useMemo(() => lecturas.filter((t) => activos.has(t.locker_id)), [lecturas, activos]);

  const lecturasOrdenadas = useMemo(() => {
    const toNum = (id) => Number(friendlyLocker(id)) || 0;
    return [...lecturasSoloActivos].sort((a, b) => toNum(a.locker_id) - toNum(b.locker_id));
  }, [lecturasSoloActivos]);

  const lecturasFiltradas = useMemo(() => {
    if (filtro === 'todos') return lecturasOrdenadas;
    if (filtro === 'con-datos') return lecturasOrdenadas.filter((l) => estadoDe(l.timestamp || l.created_at) === 'OK');
    return lecturasOrdenadas.filter((l) => estadoDe(l.timestamp || l.created_at) === 'DESACTUALIZADO');
  }, [lecturasOrdenadas, filtro]);

  const kpi = useMemo(() => {
    const total = lecturasOrdenadas.length;
    const conDatos = lecturasOrdenadas.filter((l) => estadoDe(l.timestamp || l.created_at) === 'OK').length;
    const desact = lecturasOrdenadas.filter((l) => estadoDe(l.timestamp || l.created_at) === 'DESACTUALIZADO').length;
    return { total, conDatos, desact };
  }, [lecturasOrdenadas]);

  return (
    <Box display="flex" minHeight="100vh" sx={{ bgcolor: '#0b1220' }}>
      <Sidebar />
      <Box flexGrow={1} p={3}>
        <Paper sx={(theme) => ({ p: 3, mb: 3, borderRadius: 3, color: '#fff', background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, boxShadow: '0 10px 30px rgba(0,0,0,.25)' })}>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" gap={2}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <SensorsIcon />
              <Typography variant="h5" fontWeight={700}>Estado de Lockers</Typography>
              <Chip icon={<ShieldIcon />} label="Administrador" size="small" sx={{ bgcolor: alpha('#fff', 0.15), color: '#fff', '& .MuiChip-icon': { color: '#fff' } }} />
            </Stack>

            <Stack direction="row" alignItems="center" gap={1.5}>
              <ToggleButtonGroup exclusive size="small" value={filtro} onChange={(_, val) => val && setFiltro(val)} sx={{ bgcolor: alpha('#fff', 0.15), borderRadius: 2, '& .MuiToggleButton-root': { color: '#fff', border: 'none', '&.Mui-selected': { bgcolor: alpha('#000', 0.25) } } }}>
                <ToggleButton value="todos">Todos</ToggleButton>
                <ToggleButton value="con-datos">Con datos</ToggleButton>
                <ToggleButton value="desactualizados">Desactualizados</ToggleButton>
              </ToggleButtonGroup>

              <Divider orientation="vertical" flexItem sx={{ borderColor: alpha('#fff', 0.3) }} />

              <Stack direction="row" alignItems="center" gap={1} color="#fff">
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">{lastRefreshed ? lastRefreshed.toLocaleTimeString() : '—'}</Typography>
                <Tooltip title="Actualizar">
                  <span><IconButton onClick={refreshAll} sx={{ color: '#fff' }}><RefreshIcon /></IconButton></span>
                </Tooltip>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <Typography variant="body2">Auto</Typography>
                  <Switch size="small" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} sx={{ '& .MuiSwitch-thumb': { boxShadow: 'none' } }} />
                </Stack>
              </Stack>
            </Stack>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} sx={{ mt: 2 }}>
            <KpiCard label="Activos monitoreados" value={kpi.total} />
            <KpiCard label="Con datos recientes" value={kpi.conDatos} color="success" />
            <KpiCard label="Desactualizados" value={kpi.desact} color="warning" />
          </Stack>
        </Paper>

        {cargando && <LinearProgress sx={{ mb: 2 }} />}

        {lecturasFiltradas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3, bgcolor: alpha('#fff', 0.02), color: '#c7d2fe', border: `1px dashed ${alpha('#c7d2fe', 0.3)}` }}>
            <Typography variant="h6" sx={{ mb: 1 }}>No hay lecturas disponibles para lockers activos</Typography>
            <Typography variant="body2" color="text.secondary">Verifica que existan lockers en estado <b>activo</b> y que estén enviando lecturas.</Typography>
            <Button startIcon={<RefreshIcon />} variant="outlined" sx={{ mt: 2, color: '#c7d2fe', borderColor: alpha('#c7d2fe', 0.4) }} onClick={refreshAll}>Reintentar</Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {lecturasFiltradas.map((t) => {
              const temp = t?.temperatura ?? '--';
              const hum = t?.humedad ?? '--';
              const peso = t?.peso ?? '--';
              const lockerTxt = friendlyLocker(t?.locker_id);
              const ts = t?.timestamp || t?.created_at || '';
              const est = estadoDe(ts);

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={`${t.locker_id}-${t._id}`}>
                  <GlassCard est={est}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                      <Typography variant="h6" sx={{ color: '#e2e8f0' }}>Locker {lockerTxt}</Typography>
                      <Chip label={est} size="small" color={colorEstado(est)} sx={{ fontWeight: 600 }} />
                    </Stack>

                    <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                      <Metric icon={<ThermostatIcon />} label="Temp" value={temp === '--' ? '--' : `${temp}°C`} color={temp === '--' ? 'default' : temp <= 4 ? 'info' : temp <= 10 ? 'success' : temp <= 20 ? 'warning' : 'error'} />
                      <Metric icon={<WaterDropIcon />} label="Humedad" value={hum === '--' ? '--' : `${hum}%`} color="primary" />
                      <Metric icon={<ScaleIcon />} label="Peso" value={peso === '--' ? '--' : `${peso} kg`} color="default" />
                    </Stack>

                    <Divider sx={{ my: 1.5, borderColor: alpha('#94a3b8', 0.25) }} />

                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ color: '#94a3b8' }}>
                      <Stack direction="row" alignItems="center" gap={0.75}>
                        <Badge variant="dot" color={colorEstado(est)} overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                          <SensorsIcon fontSize="small" />
                        </Badge>
                        <Typography variant="caption">{ts ? new Date(ts).toLocaleString() : 'Sin marca de tiempo'}</Typography>
                      </Stack>
                    </Stack>
                  </GlassCard>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>
    </Box>
  );
}

function KpiCard({ label, value, color = 'info' }) {
  return (
    <Paper sx={(theme) => ({ p: 2, flex: 1, borderRadius: 2, backdropFilter: 'blur(8px)', background: alpha(theme.palette.common.white, 0.12), border: `1px solid ${alpha('#fff', 0.2)}`, color: '#fff' })} elevation={0}>
      <Typography variant="overline" sx={{ opacity: 0.8 }}>{label}</Typography>
      <Typography variant="h5" fontWeight={800} color={`${color}.light`}>{value}</Typography>
    </Paper>
  );
}

function GlassCard({ children, est }) {
  return (
    <Paper elevation={0} sx={(theme) => ({
      p: 2, height: '100%', borderRadius: 3, position: 'relative', overflow: 'hidden',
      background: alpha(theme.palette.common.white, 0.04), border: `1px solid ${alpha('#94a3b8', 0.25)}`,
      backdropFilter: 'blur(8px)', transition: 'transform .2s, box-shadow .2s',
      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 30px rgba(0,0,0,.25)' },
      '&::before': {
        content: '""', position: 'absolute', inset: 0, borderRadius: 3, padding: '1px',
        background: `linear-gradient(135deg, ${bordeEstado(est)}, transparent)`,
        WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
        WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none',
      },
    })}>
      {children}
    </Paper>
  );
}

function Metric({ icon, label, value, color = 'default' }) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ flex: 1, p: 1.25, borderRadius: 2, bgcolor: alpha('#fff', 0.03), border: `1px solid ${alpha('#94a3b8', 0.2)}` }} spacing={0.5}>
      <Box sx={{ color: color === 'default' ? '#94a3b8' : undefined }}>
        {React.cloneElement(icon, { color, fontSize: 'small' })}
      </Box>
      <Typography variant="caption" sx={{ color: '#94a3b8' }}>{label}</Typography>
      <Typography variant="subtitle1" sx={{ color: '#e2e8f0', fontWeight: 700 }}>{value}</Typography>
    </Stack>
  );
}
