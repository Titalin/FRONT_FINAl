// src/pages/admin/VisualizacionGraficas.jsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Divider, Stack, TextField, InputAdornment,
  ToggleButton, ToggleButtonGroup, IconButton, Skeleton, Tooltip,
} from '@mui/material';
import Sidebar from '..//components/Layout/Sidebar';

import SearchIcon from '@mui/icons-material/Search';
import CachedIcon from '@mui/icons-material/Cached';
import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import TimelineIcon from '@mui/icons-material/Timeline';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

const LINE_COLORS = ['#4FC3F7', '#FFB74D', '#81C784', '#BA68C8', '#64B5F6', '#FF8A65', '#AED581', '#9575CD', '#4DB6AC', '#F06292'];

const statusColor = (estado) => {
  const e = String(estado || '').toLowerCase();
  if (e === 'activa') return { chip: 'success', bar: '#4CAF50' };
  if (e === 'inactiva') return { chip: 'error', bar: '#E53935' };
  return { chip: 'warning', bar: '#FFB300' };
};
const getStatusIcon = (estado) => {
  const e = String(estado || '').toLowerCase();
  if (e === 'activa') return <CheckCircleIcon sx={{ color: '#4CAF50' }} fontSize="large" />;
  if (e === 'inactiva') return <HighlightOffIcon sx={{ color: '#E53935' }} fontSize="large" />;
  return <WarningIcon sx={{ color: '#FFB300' }} fontSize="large" />;
};
const fmtDate = (d) => { if (!d) return '—'; const dt = new Date(d); return isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString(); };
const pad2 = (n) => String(n).padStart(2, '0');

const VisualizacionGraficas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [sinSub, setSinSub] = useState([]);          // ahora lo calculamos
  const [ultimas, setUltimas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [mensuales, setMensuales] = useState([]);

  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState('todas');

  const fetchDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [emp, ult, hist, men] = await Promise.all([
        api.get('/empresas'),
        api.get('/suscripciones/ultimas'),
        api.get('/suscripciones'),
        api.get('/suscripciones/mensuales'),
      ]);

      const empArr = Array.isArray(emp.data) ? emp.data : (emp.data?.data ?? []);
      const ultArr = Array.isArray(ult.data) ? ult.data : (ult.data?.data ?? []);
      const histArr = Array.isArray(hist.data) ? hist.data : (hist.data?.data ?? []);
      const menArr = Array.isArray(men.data) ? men.data : (men.data?.data ?? []);

      setEmpresas(empArr);
      setUltimas(ultArr);
      setHistorico(histArr);
      setMensuales(menArr);

      // --- Calcula "sin suscripción" en el front ---
      // Consideramos "sin suscripción" = empresas sin ningún registro en historico
      const empresasConHist = new Set(
        histArr
          .map(s => s?.empresa_id ?? s?.empresa?.id)
          .filter(Boolean)
      );
      const sin = empArr
        .filter(e => !empresasConHist.has(e.id))
        .map(e => ({ id: e.id, nombre: e.nombre, telefono: e.telefono ?? null, direccion: e.direccion ?? null }));
      setSinSub(sin);
    } catch (err) {
      console.warn('Error al obtener datos (se muestran los disponibles):', { status: err?.response?.status, body: err?.response?.data });
      // Si algo falla, deja lo que ya hay; pero si todo falla, resetea
      setEmpresas((v) => Array.isArray(v) ? v : []);
      setUltimas((v) => Array.isArray(v) ? v : []);
      setHistorico((v) => Array.isArray(v) ? v : []);
      setMensuales((v) => Array.isArray(v) ? v : []);
      setSinSub((v) => Array.isArray(v) ? v : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDatos(); }, [fetchDatos]);

  const kpis = useMemo(() => {
    const totalEmpresas = empresas.length;
    const activas = ultimas.filter(s => String(s?.estado || '').toLowerCase() === 'activa').length;
    const inactivas = ultimas.filter(s => String(s?.estado || '').toLowerCase() === 'inactiva').length;
    const sin = sinSub.length;
    return { totalEmpresas, activas, inactivas, sinSub: sin };
  }, [empresas, ultimas, sinSub]);

  const termino = busqueda.trim().toLowerCase();
  const matchTexto = (nombre) => !termino || String(nombre || '').toLowerCase().includes(termino);

  const tarjetasConSub = useMemo(() => {
    return ultimas
      .filter((s) => matchTexto(s?.empresa_nombre))
      .filter((s) => {
        const e = String(s?.estado || '').toLowerCase();
        if (estado === 'todas') return true;
        if (estado === 'activa') return e === 'activa';
        if (estado === 'inactiva') return e === 'inactiva';
        return e !== 'activa' && e !== 'inactiva';
      });
  }, [ultimas, termino, estado]);

  const tarjetasSinSub = useMemo(() => {
    if (!(estado === 'todas' || estado === 'inactiva' || estado === 'otra')) return [];
    return sinSub.filter((e) => matchTexto(e?.nombre));
  }, [sinSub, termino, estado]);

  const handleEmpresaClick = (empresaId) => {
    const seleccionada = empresas.find((e) => e.id === empresaId);
    setEmpresaSeleccionada(seleccionada || null);
  };

  const dataGraficaGeneral = useMemo(() => {
    return mensuales
      .map(r => ({ mes: `${r.anio}-${pad2(r.mes)}`, TotalSuscripciones: Number(r.total_suscripciones || 0), TotalIngresos: Number(r.total_ingresos || 0) }))
      .sort((a, b) => (a.mes < b.mes ? -1 : 1));
  }, [mensuales]);

  const dataEmpresaIndividual = useMemo(() => {
    if (!empresaSeleccionada) return [];
    const map = new Map();
    for (const s of historico) {
      const empresaIdPlano = s.empresa_id ?? s?.empresa?.id;
      if (empresaIdPlano !== empresaSeleccionada.id) continue;
      const dt = new Date(s.fecha_inicio);
      if (isNaN(dt.getTime())) continue;
      const key = `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? -1 : 1)).map(([mes, Total]) => ({ mes, Total }));
  }, [historico, empresaSeleccionada]);

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: 'linear-gradient(120deg, #1a2540 70%, #232E4F 100%)' }}>
      <Sidebar />
      <Box flexGrow={1} p={0}>
        {/* Hero */}
        <Box sx={{ background: 'linear-gradient(135deg, #1976d2 60%, #00c6fb 100%)', px: 4, py: 3, borderRadius: '0 0 24px 24px', color: '#fff', mb: 4 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
            <Box>
              <Typography variant="h5" fontWeight={800}>Estado y evolución de suscripciones</Typography>
              <Typography variant="body2" sx={{ opacity: 0.95 }}>
                Filtra por estado o busca por nombre de empresa. Haz clic en una tarjeta para ver su historial.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              {[
                { label: 'Empresas', value: kpis.totalEmpresas },
                { label: 'Activas', value: kpis.activas },
                { label: 'Inactivas', value: kpis.inactivas },
                { label: 'Sin suscripción', value: kpis.sinSub },
              ].map((k) => (
                <Paper key={k.label} elevation={6} sx={{ px: 2.5, py: 1.5, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', color: '#fff', minWidth: 130, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={800}>{k.value}</Typography>
                  <Typography variant="caption" sx={{ letterSpacing: .3 }}>{k.label}</Typography>
                </Paper>
              ))}
            </Stack>
          </Stack>

          {/* Filtros */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} mt={3} alignItems={{ xs: 'stretch', md: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar empresa…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon sx={{ color: '#fff' }} /></InputAdornment>) }}
              sx={{
                minWidth: 260,
                '& .MuiInputBase-root': { color: '#fff' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.6)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
              }}
            />
            <ToggleButtonGroup
              exclusive value={estado} onChange={(_e, v) => v && setEstado(v)} size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, '& .MuiToggleButton-root': { color: '#fff', border: 'none' }, '& .Mui-selected': { bgcolor: 'rgba(255,255,255,0.25) !important', fontWeight: 700 } }}
            >
              <ToggleButton value="todas">Todas</ToggleButton>
              <ToggleButton value="activa">Activas</ToggleButton>
              <ToggleButton value="inactiva">Inactivas</ToggleButton>
              <ToggleButton value="otra">Otras</ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Refrescar">
              <span><IconButton onClick={fetchDatos} sx={{ color: '#fff' }}><CachedIcon /></IconButton></span>
            </Tooltip>
          </Stack>
        </Box>

        <Box px={3}>
          {/* Tarjetas */}
          {loading ? (
            <Grid container spacing={3}>
              {[...Array(6)].map((_, i) => (
                <Grid key={i} item xs={12} sm={6} md={4}>
                  <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Skeleton variant="rectangular" height={10} sx={{ mb: 2 }} />
                    <Skeleton variant="circular" width={48} height={48} sx={{ mx: 'auto', mb: 1 }} />
                    <Skeleton variant="text" height={28} />
                    <Skeleton variant="text" width="60%" />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {tarjetasConSub.map((sub) => {
                const empresaId = sub?.empresa_id;
                const empresaNombre = sub?.empresa_nombre || 'Sin Empresa';
                const estadoStr = String(sub?.estado || '').toLowerCase();
                const sc = statusColor(estadoStr);
                return (
                  <Grid item xs={12} sm={6} md={4} key={`sub-${sub.suscripcion_id ?? `${empresaId}-${estadoStr}`}`}>
                    <Paper
                      onClick={() => handleEmpresaClick(empresaId)}
                      elevation={6}
                      sx={{
                        cursor: 'pointer',
                        p: 2.5, borderRadius: 3, bgcolor: '#0f172a', color: '#e6e9ef',
                        border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden',
                        transition: 'transform .18s, box-shadow .18s',
                        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 40px rgba(0,0,0,.25)' },
                        '&::before': { content: '""', position: 'absolute', inset: 0, height: 6, bgcolor: sc.bar },
                      }}
                    >
                      <Stack alignItems="center" spacing={1} mt={0.5}>
                        {getStatusIcon(estadoStr)}
                        <Typography variant="h6" sx={{ color: '#fff' }}>{empresaNombre}</Typography>
                        <Chip label={estadoStr} color={sc.chip} size="small" sx={{ fontWeight: 700 }} />
                      </Stack>
                      <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ color: '#cdd7f5' }}>
                          <BusinessIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Plan: <b>{sub?.plan_nombre || 'Sin plan'}</b>
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cdd7f5' }}>
                          <CalendarTodayIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Inicio: <b>{fmtDate(sub?.fecha_inicio)}</b>
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#cdd7f5' }}>
                          <CalendarTodayIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                          Fin: <b>{fmtDate(sub?.fecha_fin)}</b>
                        </Typography>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}

              {tarjetasSinSub.map((empresa, idx) => (
                <Grid item xs={12} sm={6} md={4} key={`no-sub-${empresa.id ?? idx}`}>
                  <Paper
                    onClick={() => handleEmpresaClick(empresa.id)}
                    elevation={4}
                    sx={{
                      cursor: 'pointer',
                      p: 2.5, borderRadius: 3, bgcolor: '#111a2b', color: '#e6e9ef',
                      border: '1px solid rgba(255,255,255,0.06)',
                      transition: 'transform .18s, box-shadow .18s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 14px 40px rgba(0,0,0,.25)' },
                      '&::before': { content: '""', position: 'absolute', inset: 0, height: 6, bgcolor: '#90A4AE' },
                    }}
                  >
                    <Stack alignItems="center" spacing={1} mt={0.5}>
                      <HighlightOffIcon sx={{ color: '#90A4AE' }} fontSize="large" />
                      <Typography variant="h6" sx={{ color: '#fff' }}>{empresa.nombre}</Typography>
                      <Chip label="Sin suscripción" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
                    </Stack>
                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.12)' }} />
                    <Stack spacing={0.5}>
                      <Typography variant="body2" sx={{ color: '#cdd7f5' }}>
                        <BusinessIcon fontSize="inherit" sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Teléfono: <b>{empresa.telefono || 'N/A'}</b>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#cdd7f5' }}>
                        Dirección: <b>{empresa.direccion || 'N/A'}</b>
                      </Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}

              {tarjetasConSub.length === 0 && tarjetasSinSub.length === 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' }}>
                    <Typography>No hay resultados para los filtros aplicados.</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {/* Gráfica mensual general */}
          <Paper elevation={0} sx={{ mt: 6, p: 3, borderRadius: 3, bgcolor: '#0f172a', color: '#e6e9ef', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ color: '#fff' }}>Totales mensuales de suscripciones e ingresos</Typography>
              <TimelineIcon sx={{ color: '#9bb6ff' }} />
            </Stack>
            {dataGraficaGeneral.length > 0 ? (
              <Box sx={{ width: '100%', height: 420 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataGraficaGeneral}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="mes" stroke="#cfd8ff" />
                    <YAxis allowDecimals={false} stroke="#cfd8ff" />
                    <RTooltip contentStyle={{ background: '#111a2b', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} labelStyle={{ color: '#9bb6ff' }} />
                    <Legend wrapperStyle={{ color: '#e6e9ef' }} />
                    <Line type="monotone" dataKey="TotalSuscripciones" stroke={LINE_COLORS[0]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 5 }} name="Total Suscripciones" />
                    <Line type="monotone" dataKey="TotalIngresos" stroke={LINE_COLORS[1]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 5 }} name="Total Ingresos" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body2" color="#b7c2d9">No hay datos mensuales disponibles.</Typography>
            )}
          </Paper>

          {/* Gráfica individual por empresa */}
          {empresaSeleccionada && (
            <Paper elevation={0} sx={{ mt: 6, p: 3, borderRadius: 3, bgcolor: '#0f172a', color: '#e6e9ef', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ color: '#fff' }}>Historial mensual — {empresaSeleccionada.nombre}</Typography>
                <Tooltip title="Haz clic en otra tarjeta para cambiar la empresa">
                  <Chip size="small" label="Seleccionada" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
                </Tooltip>
              </Stack>
              {dataEmpresaIndividual.length > 0 ? (
                <Box sx={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dataEmpresaIndividual}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="mes" stroke="#cfd8ff" />
                      <YAxis allowDecimals={false} stroke="#cfd8ff" />
                      <RTooltip contentStyle={{ background: '#111a2b', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }} labelStyle={{ color: '#9bb6ff' }} />
                      <Legend wrapperStyle={{ color: '#e6e9ef' }} />
                      <Line type="monotone" dataKey="Total" stroke="#4FC3F7" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Typography variant="body2" color="#b7c2d9">Esta empresa aún no tiene suscripciones registradas.</Typography>
              )}
            </Paper>
          )}

          <Box sx={{ height: 48 }} />
        </Box>
      </Box>
    </Box>
  );
};

export default VisualizacionGraficas;
