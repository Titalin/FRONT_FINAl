import React, { useState, useEffect, useContext } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert, CircularProgress, Stack,
  Avatar, Divider, InputAdornment, IconButton
} from '@mui/material';
import Sidebar from '../../components/Layout/Sidebar';
import { AuthContext } from '../../context/AuthContext';
import { jwtDecode } from 'jwt-decode';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../services/api';

const SettingsPage = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({ nombre: '', correo: '', contraseña: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showPass, setShowPass] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const decoded = token ? jwtDecode(token) : null;
  const userId = decoded?.id;

  const initials = (formData.nombre || decoded?.nombre || 'U').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/usuarios/${userId}`);
        setFormData({ nombre: data?.nombre || '', correo: data?.correo || '', contraseña: '' });
      } catch (err) {
        setError('Error al cargar datos del usuario.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const resp = await api.put(`/usuarios/${userId}`, formData);
      if (resp?.data?.error) throw new Error(resp.data.error);
      setMessage('Datos actualizados correctamente.');
      setFormData(prev => ({ ...prev, contraseña: '' }));
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error al actualizar usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" minHeight="100vh">
      <Sidebar />
      <Box flexGrow={1} p={3}>
        <Paper elevation={0} sx={{ mx: 'auto', p: { xs: 2.5, md: 3.5 }, maxWidth: 720, borderRadius: 3, backgroundColor: '#111a2b', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Avatar sx={{ width: 56, height: 56, fontWeight: 800, bgcolor: '#4fc3f7', color: '#0b1a2b', boxShadow: '0 6px 18px rgba(79,195,247,0.35)' }}>{initials}</Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, letterSpacing: 0.2 }}>Ajustes de perfil</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Actualiza tu información personal y credenciales.</Typography>
            </Box>
          </Stack>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 3 }} />

          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2.2}>
              <TextField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required fullWidth
                InputLabelProps={{ sx: { color: '#cfe3ff' } }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><PersonIcon sx={{ color: '#bcd2ff' }} /></InputAdornment>) }}
                sx={{ '& .MuiOutlinedInput-root': { color: '#e6e9ef', bgcolor: '#0f172a', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: '#4fc3f7' }, '&.Mui-focused fieldset': { borderColor: '#4fc3f7', boxShadow: '0 0 0 2px rgba(79,195,247,0.25)' } } }}
              />

              <TextField label="Correo" name="correo" type="email" value={formData.correo} onChange={handleChange} required fullWidth
                InputLabelProps={{ sx: { color: '#cfe3ff' } }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><EmailIcon sx={{ color: '#bcd2ff' }} /></InputAdornment>) }}
                sx={{ '& .MuiOutlinedInput-root': { color: '#e6e9ef', bgcolor: '#0f172a', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: '#4fc3f7' }, '&.Mui-focused fieldset': { borderColor: '#4fc3f7', boxShadow: '0 0 0 2px rgba(79,195,247,0.25)' } } }}
              />

              <TextField label="Contraseña (dejar vacío para no cambiar)" name="contraseña" type={showPass ? 'text' : 'password'} value={formData.contraseña} onChange={handleChange} fullWidth
                InputLabelProps={{ sx: { color: '#cfe3ff' } }}
                InputProps={{
                  startAdornment: (<InputAdornment position="start"><LockIcon sx={{ color: '#bcd2ff' }} /></InputAdornment>),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(s => !s)} edge="end" sx={{ color: '#bcd2ff' }} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { color: '#e6e9ef', bgcolor: '#0f172a', borderRadius: 2, '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&:hover fieldset': { borderColor: '#4fc3f7' }, '&.Mui-focused fieldset': { borderColor: '#4fc3f7', boxShadow: '0 0 0 2px rgba(79,195,247,0.25)' } } }}
              />
            </Stack>

            <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 3 }}>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={loading}
                sx={{ px: 3, py: 1.1, fontWeight: 800, letterSpacing: 0.3, background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)', color: '#0b1a2b', '&:hover': { filter: 'brightness(1.05)' } }}>
                {loading ? <CircularProgress size={20} sx={{ color: '#0b1a2b' }} /> : 'Guardar cambios'}
              </Button>
            </Stack>
          </Box>

          {loading && (
            <Box sx={{ position: 'absolute', top: 0, left: 0, height: 3, width: '100%', background: 'linear-gradient(90deg, rgba(79,195,247,0) 0%, rgba(79,195,247,0.9) 50%, rgba(79,195,247,0) 100%)', animation: 'shine 1.6s linear infinite',
              '@keyframes shine': { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } } }}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default SettingsPage;
