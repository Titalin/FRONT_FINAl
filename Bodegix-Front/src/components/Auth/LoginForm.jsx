// C:\Integradora\Bodegix-Front\src\components\Auth\LoginForm.jsx
import React, { useState, useContext } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {
  TextField, Button, Box, Typography, IconButton, InputAdornment, Paper, Divider,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api'; // ⬅️ usa tu wrapper

const LoginForm = () => {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [error, setError] = useState('');

  const toggleMostrarContraseña = () => setMostrarContraseña((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/usuarios/login', { correo, contraseña }); 
      if (!data?.usuario?.token) {
        setError('No se recibió token en la respuesta.');
        return;
      }
      const token = data.usuario.token;
      login(token);

      const decoded = jwtDecode(token);
      if (decoded.rol === 'superadmin' || decoded.rol_id === 1) {
        navigate('/admin/dashboard');
      } else if (decoded.rol === 'cliente' || decoded.rol_id === 2) {
        navigate('/cliente/dashboard');
      } else {
        setError('Rol no autorizado para ingresar.');
      }
    } catch (err) {
      console.error('[LoginForm] Error en login:', err);
      const msg = err?.response?.data?.message || 'Error de conexión al servidor.';
      setError(msg);
    }
  };

  const handleGoogleLoginSuccess = async ({ credential }) => {
    if (!credential) return setError('Error al obtener credenciales de Google');
    try {
      const { data } = await api.post('/usuarios/google-login', { token: credential }); // ⬅️ sin localhost
      if (!data?.usuario?.token) {
        setError('No se recibió token en la respuesta.');
        return;
      }
      const token = data.usuario.token;
      login(token);

      const decoded = jwtDecode(token);
      if (decoded.rol === 'superadmin' || decoded.rol_id === 1) {
        navigate('/admin/dashboard');
      } else if (decoded.rol === 'cliente' || decoded.rol_id === 2) {
        navigate('/cliente/dashboard');
      } else {
        setError('Rol no autorizado para ingresar.');
      }
    } catch (err) {
      console.error('[LoginForm] Google login error:', err);
      const msg = err?.response?.data?.message || 'Error al iniciar sesión con Google';
      setError(msg);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, width: '100%', maxWidth: 400 }}>
      <Typography variant="h5" align="center" gutterBottom>
        Iniciar Sesión
      </Typography>

      <form onSubmit={handleSubmit}>
        <Box mb={2}>
          <TextField
            label="Correo electrónico"
            fullWidth
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            type="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Box mb={2}>
          <TextField
            label="Contraseña"
            fullWidth
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
            type={mostrarContraseña ? 'text' : 'password'}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={toggleMostrarContraseña} edge="end">
                    {mostrarContraseña ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {error && (
          <Typography color="error" mb={2} textAlign="center">
            {error}
          </Typography>
        )}

        <Button type="submit" variant="contained" fullWidth size="large">
          Iniciar Sesión
        </Button>
      </form>

      <Divider sx={{ my: 3 }} />

      <Box textAlign="center">
        <Typography variant="body2" color="textSecondary" mb={1}>
          o usa tu cuenta de Google
        </Typography>
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={() => setError('Error en la autenticación con Google')}
          useOneTap
        />
      </Box>
    </Paper>
  );
};

export default LoginForm;
