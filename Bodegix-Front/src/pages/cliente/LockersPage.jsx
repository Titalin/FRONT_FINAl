import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Paper, Typography, Button, FormControl, InputLabel, Stack, TextField,
  MenuItem, Select, Chip, Divider
} from '@mui/material';
import {
  Lock as LockerIcon, PowerSettingsNew as EstadoIcon, Save as SaveIcon,
  Place as PlaceIcon, Category as CategoryIcon, Person as PersonIcon
} from '@mui/icons-material';
import Sidebar from '../../components/Layout/Sidebar';
import { jwtDecode } from 'jwt-decode';
import api from '../../services/api';

const palette = {
  cardBg: '#1e293b', cardBgInactive: '#2b1f24', text: '#e5e7eb', subText: 'rgba(229,231,235,0.75)',
  borderActive: '#22c55e', borderInactive: '#f43f5e', chipActiveBg: '#052e16', chipActiveText: '#86efac',
  chipInactiveBg: '#3f1d26', chipInactiveText: '#fecaca', fieldBg: 'rgba(255,255,255,0.06)',
  fieldBorder: 'rgba(255,255,255,0.18)', fieldFocus: '#60a5fa', btnDanger: '#f87171',
  btnDangerHover: '#dc2626', btnSuccess: '#4ade80', btnSuccessHover: '#22c55e', btnOutline: 'rgba(255,255,255,0.65)',
};

const LockersPage = () => {
  const [lockers, setLockers] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [token, setToken] = useState('');
  const [empresaId, setEmpresaId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const arr = (v) => (Array.isArray(v) ? v : v?.data ?? []);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;
    const decoded = jwtDecode(storedToken);
    setEmpresaId(Number(decoded.empresa_id));
    setToken(storedToken);
  }, []);

  const fetchLockers = async () => {
    try {
      const { data } = await api.get('/lockers');
      const filtered = arr(data).filter((l) => Number(l.empresa_id) === Number(empresaId));
      setLockers(filtered);
    } catch (error) {
      console.error('Error al obtener lockers:', error);
    }
  };

  const fetchEmpleados = async () => {
    try {
      const { data } = await api.get('/usuarios', { params: { rol_id: 3, empresa_id: empresaId } });
      const filtered = arr(data).filter(
        (emp) => Number(emp.empresa_id) === Number(empresaId) && String(emp.rol_id) === '3'
      );
      setEmpleados(filtered);
    } catch (error) {
      console.error('Error al obtener empleados:', error);
    }
  };

  useEffect(() => {
    if (empresaId && token) {
      fetchLockers();
      fetchEmpleados();
    }
  }, [empresaId, token]);

  const isEmpleadoValido = (usuarioId) => {
    if (usuarioId == null || usuarioId === '') return false;
    return empleados.some((e) => Number(e.id) === Number(usuarioId));
    };

  const handleUpdateLocker = async (lockerId, values) => {
    try {
      const { data } = await api.put(`/lockers/${lockerId}`, values);
      if (data?.error) throw new Error(data.error);
      fetchLockers();
    } catch (error) {
      console.error('Error al actualizar locker:', error.message);
    }
  };

  const handleChange = (lockerId, field, value) => {
    setEditValues((prev) => ({
      ...prev,
      [lockerId]: { ...(prev[lockerId] || {}), [field]: value },
    }));
  };

  const fieldSx = {
    '& .MuiInputBase-root': { bgcolor: palette.fieldBg, color: palette.text, borderRadius: 2 },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: palette.fieldBorder },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: palette.text, opacity: 0.7 },
    '& .MuiInputLabel-root': { color: palette.subText },
    '& .MuiInputLabel-root.Mui-focused': { color: palette.fieldFocus },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: palette.fieldFocus },
  };

  return (
    <Box display="flex">
      <Sidebar />
      <Box flexGrow={1} p={3}>
        <Paper sx={{ p: 3, mb: 3, bgcolor: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', color: palette.text, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight={700}>Gestión de Lockers</Typography>
          <Typography variant="body2" sx={{ color: palette.subText, mt: 0.5 }}>Edita, asigna y administra lockers.</Typography>
        </Paper>

        <Grid container spacing={3}>
          {lockers.map((locker) => {
            const isActivo = locker.estado === 'activo';
            const edit = editValues[locker.id] || {};
            const usuarioSeleccionado = edit.usuario_id !== undefined ? edit.usuario_id : locker.usuario_id ?? null;

            return (
              <Grid item xs={12} md={6} lg={6} key={locker.id}>
                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: isActivo ? palette.cardBg : palette.cardBgInactive, border: `2px solid ${isActivo ? palette.borderActive : palette.borderInactive}`, boxShadow: '0 10px 28px rgba(0,0,0,0.35)', color: palette.text }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <LockerIcon fontSize="small" sx={{ color: isActivo ? palette.borderActive : palette.borderInactive }} />
                      <Typography variant="h6" fontWeight={700}>Locker {locker.identificador}</Typography>
                    </Stack>
                    <Chip size="small" label={isActivo ? 'Activo' : 'Inactivo'} sx={{ bgcolor: isActivo ? palette.chipActiveBg : palette.chipInactiveBg, color: isActivo ? palette.chipActiveText : palette.chipInactiveText, border: `1px solid ${isActivo ? palette.borderActive : palette.borderInactive}` }} />
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap">
                    {locker.ubicacion && (
                      <Chip icon={<PlaceIcon />} label={locker.ubicacion} size="small" sx={{ color: palette.text, borderColor: palette.fieldBorder, bgcolor: 'transparent', border: `1px dashed ${palette.fieldBorder}` }} variant="outlined" />
                    )}
                    {locker.tipo && (
                      <Chip icon={<CategoryIcon />} label={locker.tipo} size="small" sx={{ color: palette.text, borderColor: palette.fieldBorder, bgcolor: 'transparent', border: `1px dashed ${palette.fieldBorder}` }} variant="outlined" />
                    )}
                    <Chip icon={<PersonIcon />} label={usuarioSeleccionado ? `Empleado #${usuarioSeleccionado}` : 'Sin asignar'} size="small" sx={{ color: palette.text, borderColor: palette.fieldBorder, bgcolor: 'transparent', border: `1px dashed ${palette.fieldBorder}` }} variant="outlined" />
                  </Stack>

                  <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.08)' }} />

                  <Stack spacing={1.25}>
                    <TextField size="small" label="Ubicación" fullWidth value={edit.ubicacion ?? locker.ubicacion ?? ''} onChange={(e) => handleChange(locker.id, 'ubicacion', e.target.value)} sx={fieldSx} />
                    <FormControl size="small" fullWidth sx={fieldSx}>
                      <InputLabel>Tipo</InputLabel>
                      <Select value={edit.tipo ?? locker.tipo ?? ''} label="Tipo" onChange={(e) => handleChange(locker.id, 'tipo', e.target.value)}>
                        <MenuItem value="frios">Fríos</MenuItem>
                        <MenuItem value="perecederos">Perecederos</MenuItem>
                        <MenuItem value="no_perecederos">No Perecederos</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth sx={fieldSx}>
                      <InputLabel>Empleado</InputLabel>
                      <Select
                        value={usuarioSeleccionado != null ? Number(usuarioSeleccionado) : ''}
                        label="Empleado"
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : Number(e.target.value);
                          if (val !== null && !isEmpleadoValido(val)) {
                            alert('Solo puedes asignar empleados con rol Trabajador (rol_id = 3) de tu empresa.');
                            return;
                          }
                          handleChange(locker.id, 'usuario_id', val);
                        }}
                      >
                        <MenuItem value=""><em>Sin asignar</em></MenuItem>
                        {empleados.map((emp) => (
                          <MenuItem key={emp.id} value={Number(emp.id)}>{emp.nombre}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Stack direction="row" spacing={1.25}>
                      <TextField size="small" label="Temp. Mínima (°C)" type="number" fullWidth value={edit.temp_min ?? locker.temp_min ?? ''} onChange={(e) => handleChange(locker.id, 'temp_min', parseFloat(e.target.value))} sx={fieldSx} />
                      <TextField size="small" label="Temp. Máxima (°C)" type="number" fullWidth value={edit.temp_max ?? locker.temp_max ?? ''} onChange={(e) => handleChange(locker.id, 'temp_max', parseFloat(e.target.value))} sx={fieldSx} />
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <TextField size="small" label="Humedad Mínima (%)" type="number" fullWidth value={edit.hum_min ?? locker.hum_min ?? ''} onChange={(e) => handleChange(locker.id, 'hum_min', parseFloat(e.target.value))} sx={fieldSx} />
                      <TextField size="small" label="Humedad Máxima (%)" type="number" fullWidth value={edit.hum_max ?? locker.hum_max ?? ''} onChange={(e) => handleChange(locker.id, 'hum_max', parseFloat(e.target.value))} sx={fieldSx} />
                    </Stack>

                    <TextField size="small" label="Peso Máximo (kg)" type="number" fullWidth value={edit.peso_max ?? locker.peso_max ?? ''} onChange={(e) => handleChange(locker.id, 'peso_max', parseFloat(e.target.value))} sx={fieldSx} />
                  </Stack>

                  <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
                    <Button
                      startIcon={<EstadoIcon />}
                      variant="contained"
                      sx={{ bgcolor: isActivo ? palette.btnDanger : palette.btnSuccess, '&:hover': { bgcolor: isActivo ? palette.btnDangerHover : palette.btnSuccessHover }, color: '#fff', fontWeight: 700 }}
                      onClick={() => {
                        const targetUsuarioId = edit.usuario_id !== undefined ? edit.usuario_id : locker.usuario_id ?? null;
                        if (!isActivo && !isEmpleadoValido(targetUsuarioId)) {
                          alert('Para activar el locker debes asignar un empleado con rol_id = 3.');
                          return;
                        }
                        handleUpdateLocker(locker.id, { estado: isActivo ? 'inactivo' : 'activo', usuario_id: targetUsuarioId ?? null });
                      }}
                    >
                      {isActivo ? 'Desactivar' : 'Activar'}
                    </Button>

                    <Button
                      startIcon={<SaveIcon />}
                      variant="outlined"
                      sx={{ borderColor: palette.btnOutline, color: palette.text, fontWeight: 700, '&:hover': { borderColor: palette.text, bgcolor: 'rgba(255,255,255,0.08)' } }}
                      onClick={() => {
                        const updatedUsuarioId = edit.usuario_id !== undefined ? edit.usuario_id : locker.usuario_id ?? null;
                        if (updatedUsuarioId !== null && !isEmpleadoValido(updatedUsuarioId)) {
                          alert('Solo puedes asignar empleados con rol_id = 3.');
                          return;
                        }
                        const valuesToUpdate = {
                          ubicacion: edit.ubicacion ?? locker.ubicacion,
                          tipo: edit.tipo ?? locker.tipo,
                          usuario_id: updatedUsuarioId,
                          temp_min: edit.temp_min ?? locker.temp_min,
                          temp_max: edit.temp_max ?? locker.temp_max,
                          hum_min: edit.hum_min ?? locker.hum_min,
                          hum_max: edit.hum_max ?? locker.hum_max,
                          peso_max: edit.peso_max ?? locker.peso_max,
                        };
                        if (updatedUsuarioId === null) valuesToUpdate.estado = 'inactivo';
                        handleUpdateLocker(locker.id, valuesToUpdate);
                      }}
                    >
                      Guardar
                    </Button>
                  </Stack>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default LockersPage;
