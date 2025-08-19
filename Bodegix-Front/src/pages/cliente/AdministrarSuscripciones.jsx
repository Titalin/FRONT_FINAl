import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, Alert,
  CircularProgress, Stack, Divider, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import Sidebar from '../../components/Layout/Sidebar';
import { jwtDecode } from 'jwt-decode';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import api from '../../services/api';

function readPaypalClientIdFromBuild() {
  try {
    if (typeof import.meta !== 'undefined' &&
        import.meta.env &&
        import.meta.env.VITE_PAYPAL_CLIENT_ID) {
      return String(import.meta.env.VITE_PAYPAL_CLIENT_ID);
    }
  } catch {}
  try {
    if (typeof process !== 'undefined' &&
        process.env &&
        process.env.REACT_APP_PAYPAL_CLIENT_ID) {
      return String(process.env.REACT_APP_PAYPAL_CLIENT_ID);
    }
  } catch {}
  try {
    if (typeof window !== 'undefined' && window.__PAYPAL_CLIENT_ID__) {
      return String(window.__PAYPAL_CLIENT_ID__);
    }
  } catch {}
  return '';
}

function toMoney(n) {
  const x = Number(n || 0);
  return Number.isFinite(x) ? x.toFixed(2) : '0.00';
}

const ui = {
  heroBg: 'linear-gradient(135deg, #1d4ed8 10%, #06b6d4 100%)',
  heroCardBg: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.12)',
  text: '#e5e7eb',
  mutted: 'rgba(229,231,235,0.75)',
  cardBg: '#0f172a',
  price: '#fff',
  primaryBtn: '#2563eb',
  primaryBtnHover: '#1d4ed8',
  outlineHover: 'rgba(255,255,255,0.08)',
  featuredRing: '#f59e0b',
  featuredShadow: '0 16px 48px rgba(0,0,0,0.35)',
};

export default function AdministrarSuscripciones() {
  const [planes, setPlanes] = useState([]);
  const [suscripcionActiva, setSuscripcionActiva] = useState(false);
  const [empresaId, setEmpresaId] = useState(null);
  const [alerta, setAlerta] = useState('');
  const [planActual, setPlanActual] = useState(null);
  const [suscripcionId, setSuscripcionId] = useState(null);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [loading, setLoading] = useState(false);

  const [paypalClientId, setPaypalClientId] = useState(() => {
    const raw = readPaypalClientIdFromBuild();
    return String(raw).replace(/[\r\n]/g, '').replace(/^['"]|['"]$/g, '').trim();
  });

  useEffect(() => {
    if (!paypalClientId) {
      api.get('paypal/client-id')
        .then(({ data }) => {
          const id = String(data?.clientId || '').trim();
          if (id) setPaypalClientId(id);
        })
        .catch(() => {});
    }
  }, [paypalClientId]);

  const HAS_PAYPAL = !!paypalClientId;
  const paypalOptions = HAS_PAYPAL ? {
    'client-id': paypalClientId,
    currency: 'MXN',
    intent: 'capture',
  } : undefined;

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const arr = (v) => (Array.isArray(v) ? v : v && v.data ? v.data : []);

  const cargarDatos = useCallback(async (empresa_id_decoded) => {
    try {
      setLoading(true);
      const planesResp = await api.get('/planes');
      const planesParsed = arr(planesResp.data);
      setPlanes(planesParsed);

      const status = (await api.get('/suscripciones/status', { params: { empresa_id: empresa_id_decoded } })).data;
      const activa = !!status && !!status.activa;

      if (!activa) {
        setSuscripcionActiva(false);
        setPlanActual(null);
        setSuscripcionId(null);
        setAlerta('No tienes una suscripción activa. Selecciona un plan para continuar.');
        return;
      }

      const todas = arr((await api.get('/suscripciones')).data);
      const sActiva = (todas || []).find(
        (s) => Number(s.empresa_id) === Number(empresa_id_decoded) && String(s.estado).toLowerCase() === 'activa'
      );

      if (!sActiva) {
        setSuscripcionActiva(false);
        setPlanActual(null);
        setSuscripcionId(null);
        setAlerta('No tienes una suscripción activa.');
        return;
      }

      const plan = planesParsed.find((p) => Number(p.id) === Number(sActiva.plan_id)) || null;

      setSuscripcionActiva(true);
      setPlanActual(plan);
      setSuscripcionId(sActiva.id);
      setAlerta('Tienes una suscripción activa.');
    } catch (err) {
      setAlerta((err && err.response && err.response.data && err.response.data.message) || err.message || 'Error al cargar información.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setAlerta('No hay sesión activa.');
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const emp = Number(decoded && decoded.empresa_id);
      if (!emp) {
        setAlerta('El token no contiene empresa_id.');
        return;
      }
      setEmpresaId(emp);
      cargarDatos(emp);
    } catch (e) {
      setAlerta('Token inválido. Inicia sesión nuevamente.');
    }
  }, [token, cargarDatos]);

  const cancelarSuscripcion = async () => {
    if (!suscripcionId) return;
    try {
      setLoading(true);
      await api.put(`/suscripciones/${suscripcionId}`, { estado: 'cancelada' });
      setAlerta('La suscripción fue cancelada correctamente.');
      if (empresaId) await cargarDatos(empresaId);
    } catch (error) {
      setAlerta((error && error.response && error.response.data && error.response.data.message) || error.message || 'Error al cancelar la suscripción.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box flexGrow={1} p={3}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            background: ui.heroBg,
            color: '#fff',
            borderRadius: 3,
            boxShadow: '0 12px 36px rgba(43, 43, 43, 0.3)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={2} justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <WorkspacePremiumIcon />
                <Typography variant="h5" fontWeight={800}>
                  Administrar Suscripciones
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ opacity: 0.95, mt: 0.5 }}>
                Activa o gestiona tu plan. Paga de forma segura con PayPal.
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: ui.heroCardBg,
                border: `1px solid ${ui.borderSoft}`,
                minWidth: 280,
                backdropFilter: 'blur(4px)',
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <CreditCardIcon fontSize="small" />
                <Typography variant="subtitle2">Estado</Typography>
                <Chip
                  size="small"
                  label={suscripcionActiva ? 'Activa' : 'Inactiva'}
                  color={suscripcionActiva ? 'success' : 'warning'}
                  sx={{ ml: 'auto' }}
                />
              </Stack>
              {planActual ? (
                <>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Plan: <b>{planActual && planActual.nombre}</b>
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.85 }}>
                    ${toMoney(planActual && planActual.costo)}/mes
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                  Selecciona un plan para comenzar.
                </Typography>
              )}
            </Paper>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3, bgcolor: ui.cardBg, color: ui.text, border: `1px solid ${ui.borderSoft}`, borderRadius: 3 }}>
          {!!alerta && <Alert severity={!suscripcionActiva ? 'warning' : 'success'} sx={{ mb: 2 }}>{alerta}</Alert>}

          {!suscripcionActiva ? (
            <>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" fontWeight={700}>
                  Elige un plan para activar tu suscripción
                </Typography>
                <Button
                  onClick={() => empresaId && cargarDatos(empresaId)}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <AutorenewIcon />}
                  variant="outlined"
                  sx={{
                    color: '#fff',
                    borderColor: ui.borderSoft,
                    '&:hover': { bgcolor: ui.outlineHover, borderColor: '#fff' },
                  }}
                >
                  {loading ? 'Actualizando…' : 'Refrescar'}
                </Button>
              </Stack>

              <Grid container spacing={3}>
                {planes.map((plan, idx) => {
                  const costo = Number(plan.costo || 0);
                  const featured = idx === 1;
                  return (
                    <Grid item xs={12} sm={6} md={4} key={String(plan.id)}>
                      <Card
                        elevation={0}
                        sx={{
                          height: '100%',
                          bgcolor: '#111827',
                          border: `1px solid ${featured ? ui.featuredRing : ui.borderSoft}`,
                          boxShadow: featured ? ui.featuredShadow : 'none',
                          borderRadius: 3,
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography
                              variant="h6"
                              fontWeight={800}
                              sx={{ color: featured ? '#fde68a' : '#93c5fd' }}
                            >
                              {plan.nombre}
                            </Typography>
                            {featured && (
                              <Chip
                                label="Recomendado"
                                size="small"
                                sx={{ ml: 'auto', bgcolor: '#f59e0b', color: '#111827', fontWeight: 700 }}
                              />
                            )}
                          </Stack>

                          <Typography variant="h3" fontWeight={900} sx={{ color: ui.price, mt: 1, lineHeight: 1 }}>
                            ${toMoney(costo)}
                            <Typography component="span" variant="subtitle2" sx={{ ml: 0.5, opacity: 0.8 }}>
                              /mes
                            </Typography>
                          </Typography>

                          <Typography variant="body2" sx={{ color: ui.mutted, mt: 1 }}>
                            Incluye:
                          </Typography>
                          <List dense sx={{ color: ui.text, pt: 0, pb: 0 }}>
                            <ListItem sx={{ py: 0.5 }}>
                              <ListItemIcon>
                                <CheckCircleIcon sx={{ color: '#34d399' }} />
                              </ListItemIcon>
                              <ListItemText primary={`Límite de usuarios: ${plan.limite_usuarios}`} />
                            </ListItem>
                            <ListItem sx={{ py: 0.5 }}>
                              <ListItemIcon>
                                <CheckCircleIcon sx={{ color: '#34d399' }} />
                              </ListItemIcon>
                              <ListItemText primary={`Lockers incluidos: ${plan.lockers}`} />
                            </ListItem>
                          </List>

                          <Divider sx={{ my: 2, borderColor: ui.borderSoft }} />

                          <Button
                            fullWidth
                            variant="contained"
                            disabled={loading || !HAS_PAYPAL}
                            onClick={() => setPlanSeleccionado(plan)}
                            sx={{ bgcolor: ui.primaryBtn, fontWeight: 800, '&:hover': { bgcolor: ui.primaryBtnHover } }}
                          >
                            {HAS_PAYPAL ? 'Pagar con PayPal' : 'Configura PAYPAL_CLIENT_ID'}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {planSeleccionado && HAS_PAYPAL && paypalOptions && (
                <Box mt={3}>
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: ui.borderSoft, bgcolor: '#0b1220' }}>
                    <Typography variant="body1" gutterBottom>
                      Pagando el plan: <b>{planSeleccionado.nombre}</b> (${toMoney(planSeleccionado.costo)})
                    </Typography>

                    <PayPalScriptProvider options={paypalOptions}>
                      <PayPalButtons
                        key={`${planSeleccionado.id}-${planSeleccionado.costo}`}
                        style={{ layout: 'vertical' }}
                        createOrder={async () => {
                          try {
                            const { data } = await api.post('/paypal/create-order', {
                              amount: Number(planSeleccionado.costo || 0),
                            });
                            if (!data || !data.id) throw new Error('No se recibió id de orden de PayPal.');
                            return data.id;
                          } catch (err) {
                            setAlerta(
                              (err && err.response && err.response.data && err.response.data.message) ||
                                err.message ||
                                'Error al iniciar el pago.'
                            );
                            throw err;
                          }
                        }}
                        onApprove={async (data) => {
                          try {
                            setLoading(true);
                            const resp = await api.post(`/paypal/capture-order/${data.orderID}`, {
                              empresa_id: Number(empresaId),
                              plan_id: Number(planSeleccionado.id),
                            });
                            setAlerta((resp && resp.data && resp.data.message) || 'Pago capturado y suscripción activada.');
                            setPlanSeleccionado(null);
                            if (empresaId) await cargarDatos(empresaId);
                          } catch (e) {
                            setAlerta(
                              (e && e.response && e.response.data && e.response.data.message) ||
                                e.message ||
                                'Hubo un problema al procesar el pago.'
                            );
                          } finally {
                            setLoading(false);
                          }
                        }}
                        onCancel={() => setPlanSeleccionado(null)}
                        onError={() => {
                          setAlerta('Error en el pago con PayPal.');
                        }}
                      />
                    </PayPalScriptProvider>
                  </Paper>
                </Box>
              )}
            </>
          ) : (
            <>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
                spacing={1.5}
                sx={{ mb: 1 }}
              >
                <Typography variant="h6" fontWeight={800}>
                  Plan actual: {planActual ? planActual.nombre : '-'}
                </Typography>
                <Button
                  onClick={() => empresaId && cargarDatos(empresaId)}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={16} /> : <AutorenewIcon />}
                  variant="outlined"
                  sx={{
                    color: '#fff',
                    borderColor: ui.borderSoft,
                    '&:hover': { bgcolor: ui.outlineHover, borderColor: '#fff' },
                  }}
                >
                  {loading ? 'Actualizando…' : 'Refrescar'}
                </Button>
              </Stack>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: ui.borderSoft, bgcolor: '#0b1220' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ color: ui.mutted }}>Usuarios permitidos</Typography>
                    <Typography variant="h6" fontWeight={800}>{planActual ? (planActual.limite_usuarios ?? '-') : '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ color: ui.mutted }}>Lockers incluidos</Typography>
                    <Typography variant="h6" fontWeight={800}>{planActual ? (planActual.lockers ?? '-') : '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" sx={{ color: ui.mutted }}>Costo mensual</Typography>
                    <Typography variant="h6" fontWeight={800}>${toMoney(planActual && planActual.costo)}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2, borderColor: ui.borderSoft }} />

                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={loading || !suscripcionId}
                    onClick={cancelarSuscripcion}
                    sx={{ borderWidth: 2, fontWeight: 800 }}
                  >
                    Cancelar suscripción
                  </Button>
                </Stack>
              </Paper>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
