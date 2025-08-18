import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  Box, Paper, Grid, Typography, TextField, Button, Alert, CircularProgress, Avatar,
  IconButton, Divider, InputAdornment, Tooltip, Chip,
} from '@mui/material';
import Sidebar from '..//components/Layout/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import api from '../../services/api';

const SettingsPage = () => {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({ nombre: '', correo: '', contraseña: '' });
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  const initials = useMemo(() => {
    const n = formData?.nombre || user?.nombre || 'U';
    const parts = String(n).trim().split(' ').filter(Boolean);
    return (parts[0]?.[0] || 'U') + (parts[1]?.[0] || '');
  }, [formData?.nombre, user?.nombre]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/usuarios/${userId}`); // SIN /api
        setFormData({ nombre: data?.nombre || '', correo: data?.correo || '', contraseña: '' });
      } catch {
        setError('Error al cargar datos del usuario.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleChange = (e) => { setFormData((p) => ({ ...p, [e.target.name]: e.target.value })); setMessage(null); setError(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await api.put(`/usuarios/${userId}`, formData);
      setMessage('Datos actualizados correctamente.');
      setFormData((p) => ({ ...p, contraseña: '' }));
    } catch (err) {
      setError(err?.response?.data?.error || 'No se pudieron guardar los cambios.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box display="flex" minHeight="100vh" sx={{ background: 'linear-gradient(120deg, #1a2540 70%, #232E4F 100%)' }}>
      <Sidebar />
      <Box flexGrow={1} p={0} sx={{ minHeight: '100vh' }}>
        <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1100, mx: 'auto' }}>
          {/* Header */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 3, color: '#fff', background: 'linear-gradient(135deg, #2a5298 40%, #00c6fb 100%)', boxShadow: '0 8px 36px rgba(0,0,0,0.18)' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700, border: '2px solid rgba(255,255,255,0.35)' }}>
                  {initials.toUpperCase()}
                </Avatar>
              </Grid>
              <Grid item xs>
                <Typography variant="h5" fontWeight={800} letterSpacing={0.3}>Tu perfil</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Actualiza tu nombre, correo y contraseña.</Typography>
              </Grid>
              <Grid item>
                {decoded?.rol_id && (
                  <Chip
                    label={decoded.rol_id === 1 ? 'SuperAdmin' : decoded.rol_id === 2 ? 'Admin Empresa' : 'Empleado'}
                    sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.25)' }}
                  />
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Form */}
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 6px 24px rgba(0,0,0,0.22)' }}>
            {loading ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2, color: '#c6d0e5' }}>Cargando tu información…</Typography>
              </Box>
            ) : (
              <>
                {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit} noValidate>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} fullWidth required size="small"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><AccountCircleIcon sx={{ color: '#9fb7ff' }} /></InputAdornment>) }}
                        sx={{ mb: 1, '& .MuiInputBase-root': { color: '#e6e9ef' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' }, '& .MuiInputLabel-root': { color: '#b7c2d9' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Correo" name="correo" type="email" value={formData.correo} onChange={handleChange} fullWidth required size="small"
                        InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon sx={{ color: '#9fb7ff' }} /></InputAdornment>) }}
                        sx={{ mb: 1, '& .MuiInputBase-root': { color: '#e6e9ef' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' }, '& .MuiInputLabel-root': { color: '#b7c2d9' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Contraseña (dejar vacío para no cambiar)" name="contraseña" type={showPwd ? 'text' : 'password'}
                        value={formData.contraseña} onChange={handleChange} fullWidth size="small"
                        InputProps={{
                          startAdornment: (<InputAdornment position="start"><LockIcon sx={{ color: '#9fb7ff' }} /></InputAdornment>),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPwd((s) => !s)} edge="end" sx={{ color: '#b7c2d9' }}>
                                {showPwd ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 1, '& .MuiInputBase-root': { color: '#e6e9ef' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.35)' }, '& .MuiInputLabel-root': { color: '#b7c2d9' } }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6} display="flex" alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                      <Tooltip title="Guardar cambios">
                        <span>
                          <Button type="submit" variant="contained" startIcon={<EditIcon />} disabled={busy}
                            sx={{ minWidth: 180, py: 1, borderRadius: 2, textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #1976d2, #00c6fb)', boxShadow: '0 8px 24px rgba(0,0,0,0.25)', '&:hover': { filter: 'brightness(1.05)' } }}>
                            {busy ? 'Guardando…' : 'Guardar cambios'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </form>

                <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Typography variant="subtitle2" sx={{ color: '#b7c2d9', mb: 0.5 }}>Tu correo</Typography>
                      <Typography sx={{ color: '#e6e9ef' }}>{formData.correo || '—'}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Typography variant="subtitle2" sx={{ color: '#b7c2d9', mb: 0.5 }}>Nombre visible</Typography>
                      <Typography sx={{ color: '#e6e9ef' }}>{formData.nombre || '—'}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default SettingsPage;
